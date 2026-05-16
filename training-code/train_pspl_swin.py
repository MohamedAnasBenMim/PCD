import os
import random
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange
from PIL import Image
from torch import einsum
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms
from tqdm import tqdm


# ============================================================================
# SWIN TRANSFORMER COMPONENTS
# ============================================================================


class CyclicShift(nn.Module):
    def __init__(self, displacement):
        super().__init__()
        self.displacement = displacement

    def forward(self, x):
        return torch.roll(x, shifts=(self.displacement, self.displacement), dims=(1, 2))


class Residual(nn.Module):
    def __init__(self, fn):
        super().__init__()
        self.fn = fn

    def forward(self, x, **kwargs):
        return self.fn(x, **kwargs) + x


class PreNorm(nn.Module):
    def __init__(self, dim, fn):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.fn = fn

    def forward(self, x, **kwargs):
        return self.fn(self.norm(x), **kwargs)


class FeedForward(nn.Module):
    def __init__(self, dim, hidden_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, dim),
        )

    def forward(self, x):
        return self.net(x)


def create_mask(window_size, displacement, upper_lower, left_right):
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


def get_relative_distances(window_size):
    indices = torch.tensor(np.array([[x, y] for x in range(window_size) for y in range(window_size)]))
    distances = indices[None, :, :] - indices[:, None, :]
    return distances


class WindowAttention(nn.Module):
    def __init__(self, dim, heads, head_dim, shifted, window_size, relative_pos_embedding):
        super().__init__()
        inner_dim = head_dim * heads

        self.heads = heads
        self.scale = head_dim**-0.5
        self.window_size = window_size
        self.relative_pos_embedding = relative_pos_embedding
        self.shifted = shifted

        if self.shifted:
            displacement = window_size // 2
            self.cyclic_shift = CyclicShift(-displacement)
            self.cyclic_back_shift = CyclicShift(displacement)
            self.upper_lower_mask = nn.Parameter(
                create_mask(
                    window_size=window_size,
                    displacement=displacement,
                    upper_lower=True,
                    left_right=False,
                ),
                requires_grad=False,
            )
            self.left_right_mask = nn.Parameter(
                create_mask(
                    window_size=window_size,
                    displacement=displacement,
                    upper_lower=False,
                    left_right=True,
                ),
                requires_grad=False,
            )

        self.to_qkv = nn.Linear(dim, inner_dim * 3, bias=False)

        if self.relative_pos_embedding:
            self.relative_indices = get_relative_distances(window_size) + window_size - 1
            self.pos_embedding = nn.Parameter(torch.randn(2 * window_size - 1, 2 * window_size - 1))
        else:
            self.pos_embedding = nn.Parameter(torch.randn(window_size**2, window_size**2))

        self.to_out = nn.Linear(inner_dim, dim)

    def forward(self, x):
        if self.shifted:
            x = self.cyclic_shift(x)

        b, n_h, n_w, _, h = *x.shape, self.heads

        qkv = self.to_qkv(x).chunk(3, dim=-1)
        nw_h = n_h // self.window_size
        nw_w = n_w // self.window_size

        q, k, v = map(
            lambda t: rearrange(
                t,
                "b (nw_h w_h) (nw_w w_w) (h d) -> b h (nw_h nw_w) (w_h w_w) d",
                h=h,
                w_h=self.window_size,
                w_w=self.window_size,
            ),
            qkv,
        )

        dots = einsum("b h w i d, b h w j d -> b h w i j", q, k) * self.scale

        if self.relative_pos_embedding:
            dots += self.pos_embedding[self.relative_indices[:, :, 0], self.relative_indices[:, :, 1]]
        else:
            dots += self.pos_embedding

        if self.shifted:
            dots[:, :, -nw_w:] += self.upper_lower_mask
            dots[:, :, nw_w - 1 :: nw_w] += self.left_right_mask

        attn = dots.softmax(dim=-1)

        out = einsum("b h w i j, b h w j d -> b h w i d", attn, v)
        out = rearrange(
            out,
            "b h (nw_h nw_w) (w_h w_w) d -> b (nw_h w_h) (nw_w w_w) (h d)",
            h=h,
            w_h=self.window_size,
            w_w=self.window_size,
            nw_h=nw_h,
            nw_w=nw_w,
        )
        out = self.to_out(out)

        if self.shifted:
            out = self.cyclic_back_shift(out)
        return out


class SwinBlock(nn.Module):
    def __init__(self, dim, heads, head_dim, mlp_dim, shifted, window_size, relative_pos_embedding):
        super().__init__()
        self.attention_block = Residual(
            PreNorm(
                dim,
                WindowAttention(
                    dim=dim,
                    heads=heads,
                    head_dim=head_dim,
                    shifted=shifted,
                    window_size=window_size,
                    relative_pos_embedding=relative_pos_embedding,
                ),
            )
        )
        self.mlp_block = Residual(PreNorm(dim, FeedForward(dim=dim, hidden_dim=mlp_dim)))

    def forward(self, x):
        x = self.attention_block(x)
        x = self.mlp_block(x)
        return x


class PatchMerging(nn.Module):
    def __init__(self, in_channels, out_channels, downscaling_factor):
        super().__init__()
        self.downscaling_factor = downscaling_factor
        self.patch_merge = nn.Unfold(kernel_size=downscaling_factor, stride=downscaling_factor, padding=0)
        self.linear = nn.Linear(in_channels * downscaling_factor**2, out_channels)

    def forward(self, x):
        b, c, h, w = x.shape
        new_h, new_w = h // self.downscaling_factor, w // self.downscaling_factor
        x = self.patch_merge(x).view(b, -1, new_h, new_w).permute(0, 2, 3, 1)
        x = self.linear(x)
        return x


class StageModule(nn.Module):
    def __init__(
        self,
        in_channels,
        hidden_dimension,
        layers,
        downscaling_factor,
        num_heads,
        head_dim,
        window_size,
        relative_pos_embedding,
    ):
        super().__init__()
        assert layers % 2 == 0, "Stage layers need to be divisible by 2 for regular and shifted block."

        self.patch_partition = PatchMerging(
            in_channels=in_channels,
            out_channels=hidden_dimension,
            downscaling_factor=downscaling_factor,
        )
        self.layers = nn.ModuleList([])
        for _ in range(layers // 2):
            self.layers.append(
                nn.ModuleList(
                    [
                        SwinBlock(
                            dim=hidden_dimension,
                            heads=num_heads,
                            head_dim=head_dim,
                            mlp_dim=hidden_dimension * 4,
                            shifted=False,
                            window_size=window_size,
                            relative_pos_embedding=relative_pos_embedding,
                        ),
                        SwinBlock(
                            dim=hidden_dimension,
                            heads=num_heads,
                            head_dim=head_dim,
                            mlp_dim=hidden_dimension * 4,
                            shifted=True,
                            window_size=window_size,
                            relative_pos_embedding=relative_pos_embedding,
                        ),
                    ]
                )
            )

    def forward(self, x):
        x = self.patch_partition(x)
        for regular_block, shifted_block in self.layers:
            x = regular_block(x)
            x = shifted_block(x)
        return x.permute(0, 3, 1, 2)


class SwinTransformerSPSD(nn.Module):
    def __init__(
        self,
        *,
        hidden_dim,
        layers,
        heads,
        channels=3,
        num_classes=1000,
        head_dim=32,
        window_size=7,
        downscaling_factors=(4, 2, 2, 2),
        relative_pos_embedding=True,
    ):
        super().__init__()

        self.stage1 = StageModule(
            in_channels=channels,
            hidden_dimension=hidden_dim,
            layers=layers[0],
            downscaling_factor=downscaling_factors[0],
            num_heads=heads[0],
            head_dim=head_dim,
            window_size=window_size,
            relative_pos_embedding=relative_pos_embedding,
        )
        self.stage2 = StageModule(
            in_channels=hidden_dim,
            hidden_dimension=hidden_dim * 2,
            layers=layers[1],
            downscaling_factor=downscaling_factors[1],
            num_heads=heads[1],
            head_dim=head_dim,
            window_size=window_size,
            relative_pos_embedding=relative_pos_embedding,
        )
        self.stage3 = StageModule(
            in_channels=hidden_dim * 2,
            hidden_dimension=hidden_dim * 4,
            layers=layers[2],
            downscaling_factor=downscaling_factors[2],
            num_heads=heads[2],
            head_dim=head_dim,
            window_size=window_size,
            relative_pos_embedding=relative_pos_embedding,
        )
        self.stage4 = StageModule(
            in_channels=hidden_dim * 4,
            hidden_dimension=hidden_dim * 8,
            layers=layers[3],
            downscaling_factor=downscaling_factors[3],
            num_heads=heads[3],
            head_dim=head_dim,
            window_size=window_size,
            relative_pos_embedding=relative_pos_embedding,
        )

        self.heads = nn.ModuleList(
            [
                nn.Sequential(
                    nn.AdaptiveAvgPool2d(1),
                    nn.Flatten(),
                    nn.LayerNorm(hidden_dim * (2**i)),
                    nn.Linear(hidden_dim * (2**i), num_classes),
                )
                for i in range(4)
            ]
        )

    def forward(self, img):
        stage_outputs = []
        x = self.stage1(img)
        stage_outputs.append(x)
        x = self.stage2(x)
        stage_outputs.append(x)
        x = self.stage3(x)
        stage_outputs.append(x)
        x = self.stage4(x)
        stage_outputs.append(x)
        return [head(feat) for feat, head in zip(stage_outputs, self.heads)]


def swin_b_spsd(hidden_dim=128, layers=(2, 2, 18, 2), heads=(4, 8, 16, 32), **kwargs):
    return SwinTransformerSPSD(hidden_dim=hidden_dim, layers=layers, heads=heads, **kwargs)


# ============================================================================
# DATASET AND TRANSFORM SUBSET
# ============================================================================


class DRDataset(Dataset):
    def __init__(self, root, domain_name, transform=None):
        self.root = os.path.join(root, domain_name)
        self.transform = transform
        self.classes = ["0", "1", "2", "3", "4"]
        self.class_to_idx = {cls: i for i, cls in enumerate(self.classes)}

        self.samples = []
        image_extensions = (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".gif")

        for class_name in self.classes:
            class_dir = os.path.join(self.root, class_name)
            if not os.path.exists(class_dir):
                continue
            class_idx = self.class_to_idx[class_name]
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(image_extensions):
                    self.samples.append((os.path.join(class_dir, img_name), class_idx))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, target = self.samples[idx]
        try:
            img = Image.open(path).convert("RGB")
            if self.transform:
                img = self.transform(img)
            return img, target
        except Exception as exc:
            print(f"Error loading {path}: {exc}")
            return self.__getitem__(random.randint(0, len(self) - 1))


class TransformSubset(Dataset):
    """
    Wrap a random_split Subset and override its transform.

    random_split returns a Subset that inherits the parent dataset transform. If
    the parent was built with train-time augmentation, the validation split also
    gets augmented. This wrapper reads the original path and applies a clean
    validation/test transform instead.
    """

    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform

    def __len__(self):
        return len(self.subset)

    def __getitem__(self, idx):
        real_idx = self.subset.indices[idx]
        path, label = self.subset.dataset.samples[real_idx]
        try:
            img = Image.open(path).convert("RGB")
            if self.transform:
                img = self.transform(img)
            return img, label
        except Exception as exc:
            print(f"Error loading {path}: {exc}")
            return self.__getitem__(random.randint(0, len(self) - 1))


# ============================================================================
# SWIN-SPSD MODEL
# ============================================================================


class SwinSPSD(nn.Module):
    def __init__(self, num_classes=5, hparams=None):
        super().__init__()
        if hparams is None:
            hparams = default_hparams()

        self.hparams = hparams
        self.lambda_ = hparams["RB_loss_weight"]
        self.beta_T = hparams["alpha_T"]
        self.n_steps = hparams["n_steps"]
        self.step_count = 0
        self.n_classes = num_classes

        self.network = swin_b_spsd(
            hidden_dim=128,
            layers=(2, 2, 18, 2),
            heads=(4, 8, 16, 32),
            num_classes=num_classes,
            channels=3,
            window_size=7,
        )

        self.optimizer = torch.optim.AdamW(
            self.network.parameters(),
            lr=hparams["lr"],
            weight_decay=hparams["weight_decay"],
        )

    def update(self, x, y):
        beta_t = self.beta_T * ((self.step_count + 1) / self.n_steps)
        beta_t = max(0.0, min(beta_t, self.beta_T))
        self.step_count += 1

        outputs = self.network(x)
        z = outputs[-1]
        stage_idx = random.randint(0, len(outputs) - 1)
        z_j = outputs[stage_idx]

        y_one_hot = torch.zeros(y.size(0), self.n_classes, device=x.device)
        y_one_hot.scatter_(1, y.unsqueeze(1), 1)

        p = F.softmax(z, dim=1)
        p_j = F.softmax(z_j, dim=1)

        soft_p = beta_t * p + (1 - beta_t) * y_one_hot
        soft_p_j = beta_t * p_j + (1 - beta_t) * y_one_hot

        base_loss = F.cross_entropy(z, y)
        rb_loss = F.kl_div(
            torch.log(soft_p_j + 1e-10),
            soft_p.detach(),
            reduction="batchmean",
        )
        loss = base_loss + self.lambda_ * rb_loss

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        return {
            "loss": loss.item(),
            "base_loss": base_loss.item(),
            "rb_loss": rb_loss.item(),
            "beta_t": beta_t,
        }

    def predict(self, x):
        return self.network(x)[-1]


# ============================================================================
# UTILITIES
# ============================================================================


def default_hparams():
    return {
        "data_augmentation": True,
        "RB_loss_weight": 0.7,
        "alpha_T": 0.8,
        "n_steps": None,
        "lr": 5e-5,
        "weight_decay": 0.05,
        "batch_size": 64,
        "val_split": 0.2,
    }


def get_transforms(augment=True):
    transform_list = [transforms.Resize((224, 224))]
    if augment:
        transform_list.extend(
            [
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.4, contrast=0.4),
            ]
        )
    transform_list.extend(
        [
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    return transforms.Compose(transform_list)


@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()
    correct, total = 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        _, predicted = torch.max(model.predict(x), 1)
        correct += (predicted == y).sum().item()
        total += y.size(0)
    return correct / total if total > 0 else 0.0


@torch.no_grad()
def evaluate_multi(model, loaders, device):
    correct, total = 0, 0
    model.eval()
    for loader in loaders:
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            _, predicted = torch.max(model.predict(x), 1)
            correct += (predicted == y).sum().item()
            total += y.size(0)
    return correct / total if total > 0 else 0.0


def format_time(seconds):
    if seconds < 60:
        return f"{seconds:.0f}s"
    if seconds < 3600:
        return f"{seconds / 60:.1f}m"
    return f"{seconds / 3600:.1f}h"


# ============================================================================
# TRAINING
# ============================================================================


def train_multi_source_dg(data_root, test_domain, num_epochs=10, hparams=None, save_path="swin_spsd_best.pth"):
    if hparams is None:
        hparams = default_hparams()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}\n")

    all_domains = ["aptos", "eyepacs", "messidor", "messidor_2"]
    train_domains = [domain for domain in all_domains if domain != test_domain]

    print(f"Training domains : {train_domains}")
    print(f"Test domain      : {test_domain} <- strictly held out until final eval\n")

    train_transform = get_transforms(augment=True)
    test_transform = get_transforms(augment=False)
    val_ratio = hparams.get("val_split", 0.2)

    train_loaders = []
    val_loaders = []

    print("Source domain split (80 train / 20 val):")
    for domain in train_domains:
        ds = DRDataset(data_root, domain, train_transform)
        train_size = int((1.0 - val_ratio) * len(ds))
        val_size = len(ds) - train_size

        train_split, val_split_raw = random_split(
            ds,
            [train_size, val_size],
            generator=torch.Generator().manual_seed(42),
        )

        val_split_clean = TransformSubset(val_split_raw, test_transform)

        train_loaders.append(
            DataLoader(train_split, batch_size=hparams["batch_size"], shuffle=True, num_workers=2)
        )
        val_loaders.append(
            DataLoader(val_split_clean, batch_size=hparams["batch_size"], shuffle=False, num_workers=2)
        )

        print(f"  {domain:15s}: {len(ds)} total -> {train_size} train | {val_size} val")

    total_train = sum(len(loader.dataset) for loader in train_loaders)
    total_val = sum(len(loader.dataset) for loader in val_loaders)
    print(f"\n  Combined source  : {total_train} train | {total_val} val\n")

    test_dataset = DRDataset(data_root, test_domain, test_transform)
    test_loader = DataLoader(test_dataset, batch_size=hparams["batch_size"], shuffle=False, num_workers=2)
    print(f"Test domain samples (held out): {len(test_dataset)}\n")

    steps_per_epoch = max(len(loader) for loader in train_loaders)
    total_steps = steps_per_epoch * num_epochs
    hparams["n_steps"] = total_steps

    print("=" * 80)
    print(" AUTOMATIC STEP CALCULATION:")
    print(f"  Steps per epoch : {steps_per_epoch}")
    print(f"  Total epochs    : {num_epochs}")
    print(f"  Total steps     : {total_steps}")
    print(f"  beta progression: 0.0 -> {hparams['alpha_T']}")
    print("=" * 80 + "\n")

    model = SwinSPSD(num_classes=5, hparams=hparams).to(device)
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}\n")

    checkpoint_steps = [int(total_steps * p) for p in [0.2, 0.5, 0.8]] + [total_steps - 1]
    expected_betas = [p * hparams["alpha_T"] for p in [0.2, 0.5, 0.8, 1.0]]

    best_val_acc = 0.0
    training_start_time = time.time()
    step_vals = {"beta_t": 0.0}

    for epoch in range(num_epochs):
        model.train()
        epoch_loss = epoch_base_loss = epoch_rb_loss = n_batches = 0

        epoch_start_time = time.time()
        train_iters = [iter(loader) for loader in train_loaders]
        max_batches = max(len(loader) for loader in train_loaders)
        epochs_left = num_epochs - epoch - 1

        pbar = tqdm(
            range(max_batches),
            desc=f"Epoch {epoch + 1}/{num_epochs} ({epochs_left} left)",
            bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]",
        )

        for batch_idx in pbar:
            all_x, all_y = [], []
            for i, (it, loader) in enumerate(zip(train_iters, train_loaders)):
                try:
                    x, y = next(it)
                except StopIteration:
                    train_iters[i] = iter(loader)
                    x, y = next(train_iters[i])
                all_x.append(x)
                all_y.append(y)

            x = torch.cat(all_x).to(device)
            y = torch.cat(all_y).to(device)

            step_vals = model.update(x, y)

            epoch_loss += step_vals["loss"]
            epoch_base_loss += step_vals["base_loss"]
            epoch_rb_loss += step_vals["rb_loss"]
            n_batches += 1

            current_step = model.step_count - 1
            if current_step in checkpoint_steps:
                idx = checkpoint_steps.index(current_step)
                pct = [20, 50, 80, 100][idx]
                expected = expected_betas[idx]
                actual = step_vals["beta_t"]
                status = "OK" if abs(actual - expected) < 0.01 else "CHECK"
                print(f"\n{status} Checkpoint {pct}%: beta_t = {actual:.4f} (expected {expected:.4f})")

            progress_pct = ((epoch * max_batches + batch_idx + 1) / (num_epochs * max_batches)) * 100
            pbar.set_postfix(
                {
                    "loss": f"{step_vals['loss']:.4f}",
                    "beta_t": f"{step_vals['beta_t']:.4f}",
                    "progress": f"{progress_pct:.1f}%",
                }
            )

        epoch_time = time.time() - epoch_start_time
        elapsed_total = time.time() - training_start_time
        avg_epoch_time = elapsed_total / (epoch + 1)
        eta = avg_epoch_time * epochs_left

        val_acc = evaluate_multi(model, val_loaders, device)

        print(f"\n{'=' * 80}")
        print(f"EPOCH {epoch + 1}/{num_epochs} COMPLETE | {epochs_left} epochs remaining")
        print(f"{'=' * 80}")
        print(f"  Time        : {format_time(epoch_time)} | Avg: {format_time(avg_epoch_time)} | ETA: {format_time(eta)}")
        print(f"  Loss        : {epoch_loss / n_batches:.4f}")
        print(f"  Base Loss   : {epoch_base_loss / n_batches:.4f}")
        print(f"  RB Loss     : {epoch_rb_loss / n_batches:.4f}")
        print(f"  Source Val  : {val_acc * 100:.2f}%  (internal 20%, no augmentation)")
        print(f"  [Test domain '{test_domain}' is strictly held out]")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f"  New best source-val accuracy. Weights saved to '{save_path}'")
        print(f"{'=' * 80}\n")

    total_time = time.time() - training_start_time

    print("\n" + "=" * 80)
    print(" TRAINING COMPLETE:")
    print(f"  Total time       : {format_time(total_time)}")
    print(f"  Steps executed   : {model.step_count} / {total_steps}")
    print(f"  Match            : {'YES' if model.step_count == total_steps else 'NO'}")
    print(f"  Final beta_t     : {step_vals['beta_t']:.4f} / {hparams['alpha_T']:.4f}")
    print(f"  Best source-val  : {best_val_acc * 100:.2f}%")
    print(f"  Weights saved to : '{save_path}'")
    print("=" * 80)

    return model, best_val_acc, test_loader, test_domain


# ============================================================================
# MAIN
# ============================================================================


if __name__ == "__main__":
    print("=" * 80)
    print("Swin-SPSD: Diabetic Retinopathy Domain Generalization")
    print(" BACKBONE   : Swin-Base (~88M params)")
    print(" SPLIT      : 80/20 per source domain via TransformSubset (clean val)")
    print(" SELECTION  : Best weights by source-val accuracy")
    print(" NO LEAKAGE : Test domain held out until final evaluation only")
    print("=" * 80)

    data_path = "./DR"

    if not os.path.exists(data_path):
        print(f"\nERROR: Dataset not found at {data_path}")
        raise SystemExit(1)

    print(f"\nDataset found    : {data_path}")
    print(f"Domains detected : {sorted(os.listdir(data_path))}\n")

    test_domain = "eyepacs"
    num_epochs = 10
    save_path = "swin_spsd_best.pth"
    hparams = default_hparams()

    print("Configuration:")
    print("  Backbone    : Swin-Base | hidden_dim=128 | layers=(2,2,18,2) | heads=(4,8,16,32)")
    print(f"  Test domain : {test_domain} <- HELD OUT")
    print("  Val split   : 80/20 per source domain (TransformSubset, no aug on val)")
    print(f"  Epochs      : {num_epochs}")
    print(f"  Batch size  : {hparams['batch_size']}")
    print(f"  LR          : {hparams['lr']}")
    print(f"  lambda      : {hparams['RB_loss_weight']}")
    print(f"  beta_T      : {hparams['alpha_T']}")
    print("  n_steps     : AUTO")
    print(f"  Save path   : {save_path}\n")

    model, best_val_acc, test_loader, test_domain = train_multi_source_dg(
        data_root=data_path,
        test_domain=test_domain,
        num_epochs=num_epochs,
        hparams=hparams,
        save_path=save_path,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nLoading best weights from '{save_path}'...")
    model.load_state_dict(torch.load(save_path, map_location=device))
    model.eval()
    print("Best weights loaded.\n")

    print("=" * 80)
    print(f"FINAL EVALUATION - held-out test domain: '{test_domain}'")
    print("=" * 80)

    test_acc = evaluate(model, test_loader, device)

    print(f"\n  -> {test_domain:15s}: {test_acc * 100:.2f}% <- true generalization accuracy")
    print(f"\n  Best source-val acc : {best_val_acc * 100:.2f}%")
    print(f"  Test domain acc     : {test_acc * 100:.2f}%")
    print("=" * 80)
    print(f"\nDone. Best weights saved to: {save_path}")
    print("=" * 80)
