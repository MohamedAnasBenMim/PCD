# Swin-SPSD Training Code

This folder contains the research/training code used to train the diabetic
retinopathy model checkpoint.

It is separate from the production application:

- `front end/` contains the React dashboard.
- `back end/server/` contains the Node.js API.
- `back end/ai-service/` contains the FastAPI inference service used by the app.
- `training-code/` contains the offline training script used to generate weights.

The dashboard does not run this script. The dashboard only needs the generated
checkpoint file and the inference API.

## Expected Dataset Layout

The script expects a local dataset folder named `DR`:

```text
training-code/
  DR/
    aptos/
      0/
      1/
      2/
      3/
      4/
    eyepacs/
      0/
      1/
      2/
      3/
      4/
    messidor/
      0/
      1/
      2/
      3/
      4/
    messidor_2/
      0/
      1/
      2/
      3/
      4/
```

Each class folder contains retinal image files.

## Run Training

From this folder:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_swin_spsd.py
```

The script saves:

```text
swin_spsd_best.pth
```

## Using The Checkpoint In The App

After training, place the generated checkpoint here:

```text
back end/swin_spsd_best.pth
```

The production inference service loads it from:

```text
back end/ai-service/main.py
```

Model checkpoint files are intentionally ignored by Git because they are large.
