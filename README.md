# sool

Traditional liquor data platform built with FastAPI, MariaDB, and Next.js.

## Repository Layout

```text
.
|-- backend/            # FastAPI app, models, migrations, data loaders
|-- frontend/           # Next.js app
|-- data/               # Shared project data and non-runtime datasets
|-- docs/               # Project docs and analysis notes
|-- exports/            # Generated outputs, dumps, ad-hoc exports
|-- scripts/            # Root-level utility scripts
|-- docker-compose.yml  # Local Docker stack
|-- .env                # Docker/local environment values
```

## Folder Rules

- Keep application code only in `backend/` and `frontend/`.
- Put reusable datasets in `data/`.
- Put generated CSV/TSV reports, dumps, and temporary exports in `exports/`.
- Put analysis writeups and snapshots in `docs/analysis/`.
- Put one-off maintenance scripts in `scripts/oneoff/`.
- Do not drop ad-hoc files directly in the repository root.

## Run With Docker

```powershell
cd D:\sool
docker compose up -d --build
```

- Frontend: `http://localhost:3300`
- Backend: `http://localhost:8000`
- MariaDB: `localhost:3307`

## Load DB Data

Initialize schema:

```powershell
cd D:\sool
docker compose exec backend python scripts/sync_db_schema.py
```

Load `sool` master data:

```powershell
cd D:\sool
docker compose exec backend python scripts/import_sool_basic.py
```

Load `sense` data:

```powershell
cd D:\sool
docker compose exec backend python scripts/load_data.py
```

Notes:

- `import_sool_basic.py` reads `backend/data/sool_basic_clean.csv`
- `load_data.py` reads `backend/data/sense_clean.csv`

## Local Development

Frontend:

```powershell
cd D:\sool\frontend
npm install
npm run dev
```

Backend:

```powershell
cd D:\sool\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
$env:PYTHONUTF8="1"
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Cleanup Direction

- `D:\sool` is the primary working repository.
- `D:\Development\sool` should be treated as an old working copy / migration source.
- Move only reviewed files from the old copy into the structured folders above.
