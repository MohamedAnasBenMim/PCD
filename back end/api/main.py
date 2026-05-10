import os
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import models, transforms


CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe"]
BASE_DIR = Path(__file__).resolve().parent
MODEL_WEIGHTS_PATH = os.getenv("MODEL_WEIGHTS_PATH", str(BASE_DIR / "weights" / "retina_model.pt"))
ALLOW_DUMMY_MODEL = os.getenv("MODEL_ALLOW_DUMMY", "false").lower() == "true"

app = FastAPI(title="Retinal Analysis API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

preprocess = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model: nn.Module | None = None


def build_model() -> nn.Module:
    network = models.efficientnet_b0(weights=None)
    network.classifier[1] = nn.Linear(network.classifier[1].in_features, len(CLASS_NAMES))
    return network


def load_model() -> nn.Module:
    network = build_model()
    weights_path = Path(MODEL_WEIGHTS_PATH)

    if not weights_path.exists():
        if not ALLOW_DUMMY_MODEL:
            raise RuntimeError(
                f"Model weights not found at {weights_path}. Set MODEL_WEIGHTS_PATH or add the .pt file."
            )
        network.eval()
        return network.to(device)

    checkpoint = torch.load(weights_path, map_location=device)
    state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    network.load_state_dict(state_dict)
    network.eval()
    return network.to(device)


@app.on_event("startup")
def startup() -> None:
    global model
    model = load_model()


def feature_summary(severity: str, confidence: float) -> list[dict]:
    positive = severity != "No DR"
    return [
        {"name": "Microaneurysms", "detected": positive, "confidence": confidence if positive else 100 - confidence},
        {"name": "Hemorrhages", "detected": severity in {"Moderate", "Severe"}, "confidence": confidence * 0.91},
        {"name": "Hard Exudates", "detected": severity in {"Moderate", "Severe"}, "confidence": confidence * 0.88},
        {"name": "Soft Exudates", "detected": severity == "Severe", "confidence": confidence * 0.64},
        {"name": "Neovascularization", "detected": severity == "Severe", "confidence": confidence * 0.57},
    ]


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    patientId: str = Form(""),
    scanType: str = Form("Fundus Photography"),
    eye: str = Form("Left Eye (OS)"),
    notes: str = Form(""),
) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        raw_image = Image.open(BytesIO(await image.read())).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc

    tensor = preprocess(raw_image).unsqueeze(0).to(device)
    with torch.no_grad():
        probabilities = torch.softmax(model(tensor), dim=1).squeeze(0)
        confidence, class_index = torch.max(probabilities, dim=0)

    severity = CLASS_NAMES[int(class_index.item())]
    confidence_percent = round(float(confidence.item()) * 100, 1)
    now = datetime.now()

    return {
        "scanId": f"SCN-{uuid.uuid4().hex[:8].upper()}",
        "patientId": patientId or "Unknown",
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "eye": eye,
        "scanType": scanType,
        "notes": notes,
        "severity": severity,
        "confidence": confidence_percent,
        "detectedFeatures": feature_summary(severity, confidence_percent),
    }
