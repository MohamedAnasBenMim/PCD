# Retinal Analysis API

Use a pretrained model for this project. Keep the React app as the UI, use Node.js as the main API/backend, and run the PyTorch model in this Python inference service.

## Expected weights

By default the API looks for:

```bash
api/weights/retina_model.pt
```

The sample API expects an EfficientNet-B0 classifier with four output classes:

```text
No DR, Mild, Moderate, Severe
```

If your trained model uses another architecture or a different class list, update `build_model()` and `CLASS_NAMES` in `api/main.py`.

## Run

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
MODEL_WEIGHTS_PATH=weights/retina_model.pt uvicorn main:app --reload --port 8000
```

Then start the frontend from the project root:

```bash
npm run dev
```

The Node.js backend posts the selected image to `http://localhost:8000/predict`. To use another URL in Node, set `PYTORCH_API_URL` in `server/.env`.

For local testing without Node, the frontend can still point directly to this service by setting:

```bash
VITE_ANALYSIS_API_URL=http://localhost:8000/predict
```

For UI-only development without real weights, you can start the API with `MODEL_ALLOW_DUMMY=true`, but do not use dummy predictions for clinical or demo accuracy claims.
