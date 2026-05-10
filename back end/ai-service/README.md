# AI Service

FastAPI service for diabetic retinopathy inference using `swin_spsd_best.pth`.

The service recreates the SwinSPSD/Swin Transformer architecture before calling `load_state_dict()` because the `.pth` file contains weights, not a complete serialized model.

## Run

```bash
cd "back end/ai-service"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Expected model file:

```text
back end/swin_spsd_best.pth
```

Endpoint:

```text
POST /predict
field: image
```

Response:

```json
{
  "class_id": 0,
  "severity": "No diabetic retinopathy",
  "is_diabetic": false,
  "confidence": 0.94
}
```
