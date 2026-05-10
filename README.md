# Medical AI Platform Interface

This repository is organized for jury review into two main folders:

- `front end/` - React + Vite user interface
- `back end/` - Node.js API, PostgreSQL schema, and Python AI services

Demo video: `recording.webm`

## Project Flow

```text
React frontend -> Node.js API -> Python AI inference service -> PostgreSQL
```

The frontend sends retinal scan uploads to the Node.js backend. The backend forwards images to the Python FastAPI AI service for prediction, then stores analysis records in PostgreSQL.

## Run Locally

Use three terminals.

1. Start the AI service:

```bash
cd "back end/ai-service"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

2. Start the Node.js backend:

```bash
cd "back end/server"
npm install
cp .env.example .env
npm run dev
```

3. Start the frontend:

```bash
cd "front end"
npm install
npm run dev
```

## Database

Create the PostgreSQL database and run the schema:

```bash
createdb medical_ai_platform
psql medical_ai_platform -f "back end/server/sql/001_init.sql"
```

## Model File

The trained checkpoint is too large for normal GitHub storage. For local inference, place it here:

```text
back end/swin_spsd_best.pth
```

The `.gitignore` keeps model checkpoints out of Git so pushes stay below GitHub's file size limit.
