# Diabetic EyeDx

Diabetic EyeDx is a full-stack retinal-screening prototype that helps doctors upload fundus images, run diabetic-retinopathy inference, review scan history, and manage the application workspace.

The project combines a React dashboard, a Node.js API, a PostgreSQL database, and a PyTorch/FastAPI inference service built around a Swin-SPSD model.

> **Clinical notice:** This repository is a research and software prototype. Its predictions are decision-support output only and must not be used as a standalone diagnosis or treatment recommendation. A qualified clinician must review every case.

## What it includes

- Doctor registration and login with JWT-based sessions.
- Retinal image upload with patient and scan metadata.
- Five-class diabetic-retinopathy prediction:
  - No diabetic retinopathy
  - Mild diabetic retinopathy
  - Moderate diabetic retinopathy
  - Severe diabetic retinopathy
  - Proliferative diabetic retinopathy
- Dashboard with recent scan activity and review status.
- Searchable scan history with severity and status filters.
- Admin login for doctor-account and scan-record management.
- PostgreSQL persistence for scan metadata, predictions, and detected-feature records.
- Offline training code for producing the model checkpoint used by the inference service.

## System architecture

~~~text
                         ┌──────────────────────┐
                         │ React + Vite frontend │
                         │       port 5173      │
                         └──────────┬───────────┘
                                    │ HTTP/JSON + multipart upload
                                    ▼
                         ┌──────────────────────┐
                         │ Express API server   │
                         │       port 5000      │
                         └───────┬───────┬──────┘
                                 │       │
                    SQL metadata │       │ multipart image
                                 ▼       ▼
                         ┌──────────┐  ┌────────────────────┐
                         │PostgreSQL│  │ FastAPI AI service  │
                         │          │  │       port 8000     │
                         └──────────┘  └─────────┬──────────┘
                                                  │
                                                  ▼
                                      Swin-SPSD checkpoint
~~~

### Analysis flow

1. A doctor selects a retinal image and enters patient metadata in the frontend.
2. The frontend sends a multipart request to the Node.js server.
3. The Node.js server validates the upload and forwards the image to FastAPI.
4. FastAPI resizes the image to 224 × 224, applies ImageNet normalization, and runs the Swin-SPSD model on CPU or CUDA.
5. The prediction is returned to the Node.js server.
6. The server can persist scan metadata and prediction results in PostgreSQL.

The application keeps image bytes in memory during inference. The current schema stores the original filename, MIME type, and file size, but does not store the uploaded image itself.

## Repository layout

~~~text
.
├── front end/
│   ├── src/app/pages/       # Public pages, doctor workspace, and admin screens
│   ├── src/app/components/  # Layout and reusable UI components
│   ├── src/app/lib/         # Auth and API helpers
│   ├── package.json
│   └── vite.config.ts
├── back end/
│   ├── server/              # Active Express API and PostgreSQL access layer
│   │   ├── src/index.js
│   │   ├── src/db.js
│   │   └── sql/001_init.sql
│   ├── ai-service/           # Active FastAPI + PyTorch inference service
│   │   └── main.py
│   └── api/                  # Alternate/sample retinal API; not used by the main flow
├── training-code/
│   └── train_pspl_swin.py    # Offline model training and evaluation script
├── recording.webm            # Product/demo recording
└── README.md
~~~

## Requirements

- Node.js 18 or newer recommended
- npm
- Python 3.10 or newer recommended
- PostgreSQL
- A compatible PyTorch installation; CUDA is optional, and the inference service falls back to CPU
- A trained checkpoint named swin_spsd_best.pth

The checkpoint is intentionally ignored by Git because model files can be large. It must be supplied locally or generated with the training script.

## Quick start

The application is made up of three processes. Start them in separate terminals.

### 1. Create the database

~~~bash
createdb medical_ai_platform
psql medical_ai_platform -f "back end/server/sql/001_init.sql"
~~~

The schema creates users for doctor accounts, scans for scan metadata and model results, and detected_features for per-scan findings.

### 2. Provide the model checkpoint

Place the trained checkpoint at exactly:

~~~text
back end/swin_spsd_best.pth
~~~

The AI service loads this file during startup. If it is missing, the service will fail to start.

### 3. Start the AI service

~~~bash
cd "back end/ai-service"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
~~~

Verify it is available:

~~~bash
curl http://localhost:8000/health
~~~

Expected response:

~~~json
{"ok":true,"device":"cpu"}
~~~

The device value may be a CUDA device when PyTorch detects a compatible GPU.

### 4. Start the Node.js API

~~~bash
cd "back end/server"
npm install
cp .env.example .env
npm run dev
~~~

Edit .env before using the application. At minimum, set a private JWT_SECRET, a strong admin password, and the correct PostgreSQL connection string.

The API should be available at http://localhost:5000.

### 5. Start the frontend

~~~bash
cd "front end"
npm install
cp .env.example .env
npm run dev
~~~

Open the Vite URL shown in the terminal, normally http://localhost:5173.

## Configuration

### Backend: back end/server/.env

| Variable | Default | Purpose |
| --- | --- | --- |
| PORT | 5000 | Express server port |
| CLIENT_ORIGIN | http://localhost:5173 | Comma-separated allowed frontend origins |
| DATABASE_URL | postgres://postgres:postgres@localhost:5432/medical_ai_platform | PostgreSQL connection string |
| AI_SERVICE_URL | http://localhost:8000/predict | FastAPI prediction endpoint |
| JWT_SECRET | dev-secret | JWT signing secret; change in real deployments |
| ADMIN_EMAIL | admin@eyedx.local | Admin login email |
| ADMIN_PASSWORD | admin123456 | Admin login password; change in real deployments |

PYTORCH_API_URL is also accepted as a legacy fallback when AI_SERVICE_URL is not set.

### Frontend: front end/.env

| Variable | Default | Purpose |
| --- | --- | --- |
| VITE_API_URL | http://localhost:5000 | Base API URL for authentication, history, and admin requests |
| VITE_ANALYZE_API_URL | http://localhost:5000/api/analyze | Upload endpoint used by the current upload page |
| VITE_ANALYSIS_API_URL | http://localhost:5000/api/analysis | Rich analysis endpoint exposed by the API client |

Vite exposes VITE_* values to the browser. Do not put secrets in the frontend .env file.

## Frontend routes

### Public routes

| Route | Purpose |
| --- | --- |
| / | Landing page |
| /features | Product features |
| /about | Product and clinical-positioning information |
| /contact | Contact page |
| /login | Doctor login |
| /register | Doctor registration |
| /admin/login | Admin login |

### Authenticated doctor routes

| Route | Purpose |
| --- | --- |
| /app | Dashboard |
| /app/upload | Upload and analyze a retinal image |
| /app/history | Browse stored scans |
| /app/analysis/:id | View an analysis result screen |
| /app/users | Current doctor profile |
| /app/support | Support page |

The doctor workspace is guarded in the frontend by a JWT stored in localStorage. The admin workspace uses a separate admin token.

## HTTP API

The active server is back end/server/src/index.js.

### Health and authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | None | Checks whether PostgreSQL is reachable |
| POST | /api/auth/register | None | Creates a doctor account and returns a 30-day JWT |
| POST | /api/auth/login | None | Authenticates a doctor and returns a 30-day JWT |
| POST | /api/auth/admin/login | None | Authenticates the configured admin and returns a 12-hour JWT |

### Scan analysis and history

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| POST | /api/analyze | multipart field image plus optional metadata | Forwards an image to FastAPI, persists the result when possible, and returns the raw AI prediction |
| POST | /api/analysis | multipart field image plus optional metadata | Same inference flow, but returns an enriched record with a generated scan ID and timestamps |
| GET | /api/scans?limit=50 | None | Returns recent stored scans; limit is clamped to 1–500 |
| GET | /api/analysis/:scanId | None | Returns one stored analysis and its detected features |

Accepted multipart metadata includes patientId, patientName, scanType, eye, and notes. The Node server accepts image uploads up to 10 MB.

Example raw prediction:

~~~json
{
  "class_id": 2,
  "severity": "Moderate diabetic retinopathy",
  "is_diabetic": true,
  "confidence": 0.913
}
~~~

### Admin endpoints

These endpoints require Authorization: Bearer <admin-token>:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/admin/users | List doctor accounts |
| POST | /api/admin/users | Create a doctor account |
| PATCH | /api/admin/users/:id | Update a doctor account |
| DELETE | /api/admin/users/:id | Delete a doctor account |
| PATCH | /api/admin/scans/:scanId | Update scan metadata or severity |
| DELETE | /api/admin/scans/:scanId | Delete a scan record |

## Model and inference

The active inference service implements the same Swin-SPSD architecture used by the training script. At startup it:

1. Selects cuda when available, otherwise cpu.
2. Loads back end/swin_spsd_best.pth.
3. Removes a possible module. prefix from checkpoint keys.
4. Sets the model to evaluation mode.

Input preprocessing is:

~~~text
Resize(224, 224)
ToTensor()
Normalize(mean=[0.485, 0.456, 0.406],
          std=[0.229, 0.224, 0.225])
~~~

The returned confidence is the maximum softmax probability. It is not a calibrated probability and should not be interpreted as clinical certainty.

AI service endpoints:

~~~text
GET  /health
POST /predict      # multipart/form-data field: image
~~~

## Training the checkpoint

Training is offline and is not required to run the dashboard once a checkpoint is available. The training code expects four local retinal-image domains:

~~~text
training-code/
└── DR/
    ├── aptos/
    │   ├── 0/  1/  2/  3/  4/
    ├── eyepacs/
    │   ├── 0/  1/  2/  3/  4/
    ├── messidor/
    │   └── 0/  1/  2/  3/  4/
    └── messidor_2/
        └── 0/  1/  2/  3/  4/
~~~

Each numbered directory contains image files. The datasets are not included in this repository; obtain and use them according to their own licenses and terms.

Run training from training-code/:

~~~bash
cd training-code
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_pspl_swin.py
~~~

The current script configuration is:

- Swin-Base-style backbone with hidden_dim=128
- Stages configured with layers (2, 2, 18, 2) and heads (4, 8, 16, 32)
- Five output classes
- 80/20 train/validation split for each source domain
- eyepacs held out as the default test domain
- 10 epochs, batch size 64, learning rate 5e-5
- Best checkpoint selected using combined source-domain validation accuracy

The script writes swin_spsd_best.pth in the training directory. Copy it to:

~~~text
back end/swin_spsd_best.pth
~~~

Do not claim model quality from the repository alone. The training script prints validation and held-out accuracy for the specific dataset and run, but no benchmark results are committed here.

## Security and deployment notes

Before exposing this prototype beyond localhost:

- Replace the default JWT_SECRET and admin password.
- Use HTTPS and secure, short-lived token handling.
- Restrict CLIENT_ORIGIN to trusted origins.
- Add server-side authentication and authorization to scan/history endpoints.
- Add doctor-to-patient/scan ownership rules and audit logging.
- Define retention, encryption, backup, and deletion policies for protected health information.
- Validate image content and dimensions in addition to MIME type and file size.
- Add rate limiting, structured logging, monitoring, and request IDs.
- Perform clinical validation, bias evaluation, calibration, and regulatory review before clinical use.

## Current implementation notes

- back end/api/ is an alternate/sample FastAPI implementation with a different model interface. The active application uses back end/ai-service/.
- The active upload page currently calls /api/analyze and displays the immediate prediction. The API also exposes /api/analysis for a richer persisted response.
- The result screen can render session-stored data or fallback demo data, while dashboard/history data comes from PostgreSQL-backed API calls.
- Uploaded image files are not persisted by the current backend; only scan metadata and prediction fields are stored.
- There is no Docker Compose configuration, automated test suite, or CI workflow in the repository at present.

## Troubleshooting

### The AI service exits during startup

Confirm that the checkpoint exists at:

~~~text
back end/swin_spsd_best.pth
~~~

Also verify that the checkpoint was created from the compatible Swin-SPSD architecture and that the Python environment has a working PyTorch installation.

### The Node API returns 503 during analysis

Check that the AI service is running on port 8000 and that AI_SERVICE_URL points to its /predict endpoint:

~~~bash
curl http://localhost:8000/health
~~~

### The Node API health check reports an unavailable database

Verify PostgreSQL is running, the database exists, and DATABASE_URL matches the credentials and port. Reapply the schema if the tables have not been created.

### The browser cannot call the API

Check CLIENT_ORIGIN in the backend .env and the VITE_* URLs in the frontend .env. Restart both development servers after changing environment files.

## Demo

The repository includes a demo recording at [recording.webm](./recording.webm).

## License

No license file is currently included. Add an explicit license before distributing the code or model, and review the separate licenses and terms for any training datasets or third-party assets.
