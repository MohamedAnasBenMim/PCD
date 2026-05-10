# Back End

Backend services for the Medical AI Platform.

## Contents

- `server/` - Node.js Express API used by the frontend
- `server/sql/001_init.sql` - PostgreSQL schema
- `ai-service/` - FastAPI inference service that loads `swin_spsd_best.pth`
- `api/` - alternate/sample FastAPI inference service

## Run Order

1. Create the PostgreSQL database and apply `server/sql/001_init.sql`.
2. Start `ai-service/` on port `8000`.
3. Start `server/` on port `5000`.
4. Start the frontend from `../front end/`.

## Model File

Put the trained model checkpoint here:

```text
back end/swin_spsd_best.pth
```

It is intentionally ignored by Git because it exceeds GitHub's normal file size limit.
