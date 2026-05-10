from collections import OrderedDict
from pathlib import Path
from typing import Dict

import torch
from einops import rearrange
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torch import einsum, nn
from torchvision import transforms


LABELS: Dict[int, str] = {
    0: "No diabetic retinopathy",
    1: "Mild diabetic retinopathy",
    2: "Moderate diabetic retinopathy",
    3: "Severe diabetic retinopathy",
    4: "Proliferative diabetic retinopathy",
}

BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_PATH = BASE_DIR.parent / "swin_spsd_best.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class Residual(nn.Module):
    def __init__(self, fn: nn.Module):
        super().__init__()
        self.fn = fn

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.fn(x) + x


class PreNorm(nn.Module):
    def __init__(self, dim: int, fn: nn.Module):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.fn = fn

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.fn(self.norm(x))


class FeedForward(nn.Module):
    def __init__(self, dim: int, hidden_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def create_mask(window_size: int, displacement: int, upper_lower: bool, left_right: bool) -> torch.Tensor:
    mask = torch.zeros(window_size**2, window_size**2)

    if upper_lower:
        mask[-displacement * window_size :, : -displacement * window_size] = float("-inf")
        mask[: -displacement * window_size, -displacement * window_size :] = float("-inf")

    if left_right:
        mask = rearrange(mask, "(h1 w1) (h2 w2) -> h1 w1 h2 w2", h1=window_size, h2=window_size)
        mask[:, -displacement:, :, :-displacement] = float("-inf")
        mask[:, :-displacement, :, -displacement:] = float("-inf")
        mask = rearrange(mask, "h1 w1 h2 w2 -> (h1 w1) (h2 w2)")

    return mask


class CyclicShift(nn.Module):
    def __init__(self, displacement: int):
        super().__init__()
        self.displacement = displacement

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.roll(x, shifts=(self.displacement, self.displacement), dims=(1, 2))


class WindowAttention(nn.Module):
    def __init__(self, dim: int, heads: int, head_dim: int, shifted: bool, window_size: int):
        super().__init__()
        inner_dim = head_dim * heads
        self.heads = heads
        self.scale = head_dim**-0.5
        self.window_size = window_size
        self.shifted = shifted

        if shifted:
            displacement = window_size // 2
            self.cyclic_shift = CyclicShift(-displacement)
            self.cyclic_back_shift = CyclicShift(displacement)
            self.register_buffer(
                "upper_lower_mask",
                create_mask(window_size=window_size, displacement=displacement, upper_lower=True, left_right=False),
            )
            self.register_buffer(
                "left_right_mask",
                create_mask(window_size=window_size, displacement=displacement, upper_lower=False, left_right=True),
            )

        # Relative positional bias table. This name/shape matches the training checkpoint.
        self.pos_embedding = nn.Parameter(torch.randn(2 * window_size - 1, 2 * window_size - 1))
        self.to_qkv = nn.Linear(dim, inner_dim * 3, bias=False)
        self.to_out = nn.Linear(inner_dim, dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.shifted:
            x = self.cyclic_shift(x)

        b, h, w, _ = x.shape
        qkv = self.to_qkv(x).chunk(3, dim=-1)
        q, k, v = [
            rearrange(
                t,
                "b (nw_h w_h) (nw_w w_w) (heads d) -> b heads (nw_h nw_w) (w_h w_w) d",
                heads=self.heads,
                w_h=self.window_size,
                w_w=self.window_size,
            )
            for t in qkv
        ]

        dots = einsum("b h w i d, b h w j d -> b h w i j", q, k) * self.scale

        rel = self.pos_embedding
        rel_h = torch.arange(self.window_size, device=x.device)
        rel_w = torch.arange(self.window_size, device=x.device)
        rel_h = rearrange(rel_h, "i -> i 1") - rearrange(rel_h, "j -> 1 j") + self.window_size - 1
        rel_w = rearrange(rel_w, "i -> i 1") - rearrange(rel_w, "j -> 1 j") + self.window_size - 1
        pos = rel[rel_h[:, :, None, None], rel_w[None, None, :, :]]
        pos = rearrange(pos, "i j k l -> (i k) (j l)")
        dots = dots + pos

        if self.shifted:
            dots[:, :, -w // self.window_size :] += self.upper_lower_mask
            dots[:, :, w // self.window_size - 1 :: w // self.window_size] += self.left_right_mask

        attn = dots.softmax(dim=-1)
        out = einsum("b h w i j, b h w j d -> b h w i d", attn, v)
        out = rearrange(
            out,
            "b heads (nw_h nw_w) (w_h w_w) d -> b (nw_h w_h) (nw_w w_w) (heads d)",
            heads=self.heads,
            w_h=self.window_size,
            w_w=self.window_size,
            nw_h=h // self.window_size,
            nw_w=w // self.window_size,
        )
        out = self.to_out(out)

        if self.shifted:
            out = self.cyclic_back_shift(out)

        return out


class SwinBlock(nn.Module):
    def __init__(self, dim: int, heads: int, head_dim: int, mlp_dim: int, shifted: bool, window_size: int):
        super().__init__()
        self.attention_block = Residual(PreNorm(dim, WindowAttention(dim, heads, head_dim, shifted, window_size)))
        self.mlp_block = Residual(PreNorm(dim, FeedForward(dim, mlp_dim)))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.attention_block(x)
        x = self.mlp_block(x)
        return x


class PatchMerging(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, downscaling_factor: int):
        super().__init__()
        self.downscaling_factor = downscaling_factor
        self.linear = nn.Linear(in_channels * downscaling_factor**2, out_channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        factor = self.downscaling_factor
        x = rearrange(x, "b c (h p1) (w p2) -> b h w (p1 p2 c)", p1=factor, p2=factor)
        return self.linear(x)


class StageModule(nn.Module):
    def __init__(
        self,
        in_channels: int,
        hidden_dimension: int,
        layers: int,
        downscaling_factor: int,
        num_heads: int,
        head_dim: int,
        window_size: int,
    ):
        super().__init__()
        self.patch_partition = PatchMerging(in_channels, hidden_dimension, downscaling_factor)
        self.layers = nn.ModuleList([])

        for _ in range(layers):
            self.layers.append(
                nn.ModuleList(
                    [
                        SwinBlock(hidden_dimension, num_heads, head_dim, hidden_dimension * 4, False, window_size),
                        SwinBlock(hidden_dimension, num_heads, head_dim, hidden_dimension * 4, True, window_size),
                    ]
                )
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.patch_partition(x)
        for regular_block, shifted_block in self.layers:
            x = regular_block(x)
            x = shifted_block(x)
        return x.permute(0, 3, 1, 2)


class SwinTransformer(nn.Module):
    # This architecture mirrors the SwinSPSD state_dict in swin_spsd_best.pth.
    def __init__(self, num_classes: int = 5):
        super().__init__()
        self.stage1 = StageModule(3, 128, layers=1, downscaling_factor=4, num_heads=4, head_dim=32, window_size=7)
        self.stage2 = StageModule(128, 256, layers=1, downscaling_factor=2, num_heads=8, head_dim=32, window_size=7)
        self.stage3 = StageModule(256, 512, layers=9, downscaling_factor=2, num_heads=16, head_dim=32, window_size=7)
        self.stage4 = StageModule(512, 1024, layers=1, downscaling_factor=2, num_heads=32, head_dim=32, window_size=7)
        self.heads = nn.ModuleList(
            [
                nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(1), nn.LayerNorm(128), nn.Linear(128, num_classes)),
                nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(1), nn.LayerNorm(256), nn.Linear(256, num_classes)),
                nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(1), nn.LayerNorm(512), nn.Linear(512, num_classes)),
                nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(1), nn.LayerNorm(1024), nn.Linear(1024, num_classes)),
            ]
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stage1(x)
        logits_1 = self.heads[0](x)
        x = self.stage2(x)
        logits_2 = self.heads[1](x)
        x = self.stage3(x)
        logits_3 = self.heads[2](x)
        x = self.stage4(x)
        logits_4 = self.heads[3](x)
        return torch.stack([logits_1, logits_2, logits_3, logits_4]).mean(dim=0)


class SwinSPSD(nn.Module):
    def __init__(self, num_classes: int = 5):
        super().__init__()
        self.network = SwinTransformer(num_classes=num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


def load_model() -> nn.Module:
    if not WEIGHTS_PATH.exists():
        raise RuntimeError(f"Missing weights file: {WEIGHTS_PATH}")

    model = SwinSPSD(num_classes=len(LABELS)).to(DEVICE)
    checkpoint = torch.load(WEIGHTS_PATH, map_location=DEVICE)
    state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    state_dict = OrderedDict((key.replace("module.", ""), value) for key, value in state_dict.items())
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    return model


preprocess = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

app = FastAPI(title="Diabetic Retinopathy AI Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "device": str(DEVICE)}


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        pil_image = Image.open(image.file).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    tensor = preprocess(pil_image).unsqueeze(0).to(DEVICE)

    # AI inference happens here. Gradients are disabled because this service only predicts.
    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        confidence, class_id = torch.max(probabilities, dim=0)

    class_id_int = int(class_id.item())
    confidence_float = float(confidence.item())

    return {
        "class_id": class_id_int,
        "severity": LABELS[class_id_int],
        "is_diabetic": class_id_int != 0,
        "confidence": round(confidence_float, 4),
    }
