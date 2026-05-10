
  # Medical AI Platform Interface

  This is a code bundle for Medical AI Platform Interface. The original project is available at https://www.figma.com/design/ZnN9N1iqfnfZvczdtGToGB/Medical-AI-Platform-Interface.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Architecture

  This project is structured for:

  - React + Vite frontend in `src/`
  - Node.js API backend in `server/`
  - PyTorch FastAPI inference service in `ai-service/`
  - PostgreSQL database using `server/sql/001_init.sql`

  Runtime flow:

  ```text
  React upload page -> Node.js /api/analyze -> Python FastAPI /predict -> React result display
  ```

  ## Backend setup

  Create the database and run the schema:

  ```bash
  createdb medical_ai_platform
  psql medical_ai_platform -f server/sql/001_init.sql
  ```

  Start the Node.js API:

  ```bash
  cd server
  npm install
  cp .env.example .env
  npm run dev
  ```

  Start the PyTorch service separately:

  ```bash
  cd ai-service
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
  ```

  The React upload page calls the Node.js endpoint at `http://localhost:5000/api/analyze`.
  The Node.js backend forwards the image to the PyTorch endpoint at `http://localhost:8000/predict`.
  The AI service loads `swin_spsd_best.pth` from the project root.
  
