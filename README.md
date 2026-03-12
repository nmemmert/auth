# Authelia File Auth Admin Workspace

This workspace includes two complete implementations for managing Authelia file-based authentication users.

## What is included

- Node stack
  - Express API in `node-stack/backend`
  - React UI in `node-stack/frontend`
- Python stack
  - FastAPI backend in `python-stack/backend`
  - Static JS UI in `python-stack/frontend`
- Shared data file in `data/users_database.yml`
- One `docker-compose.yml` to run all services

Both APIs support:

- List users
- Create users
- Update users (display name, email, groups, disabled)
- Delete users
- Reset password (Argon2id hash)
- List groups

## Security model

- Every API route under `/api` requires header `x-admin-token`.
- Set `ADMIN_API_TOKEN` in backend `.env` files.
- Frontends ask for the token at runtime.
- Use Authelia access-control to gate these UIs to admin users only.

## Quick start (Docker)

1. Update API token in:
   - `node-stack/backend/.env`
   - `python-stack/backend/.env`
2. Start all services:

```powershell
docker compose up --build
```

3. Open UIs:
   - Node UI: http://localhost:3100
   - Python UI: http://localhost:3200

## Quick start (without Docker)

### Node stack

1. Backend:

```powershell
cd node-stack/backend
npm install
npm run dev
```

2. Frontend:

```powershell
cd node-stack/frontend
npm install
npm run dev
```

3. Open http://localhost:3100 and use API base `http://localhost:4100`.

### Python stack

1. Backend:

```powershell
cd python-stack/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 5100
```

2. Frontend:

```powershell
cd python-stack/frontend
python -m http.server 3200
```

3. Open http://localhost:3200 and use API base `http://localhost:5100`.

## Authelia file format notes

- This project writes to `users_database.yml` in the expected Authelia map format under `users`.
- Passwords are hashed with Argon2id before writing.
- Writes are atomic using temp + rename and create a `.bak` backup.

## Recommended production hardening

- Put admin UI/API behind Authelia policy requiring admin group.
- Restrict network access to these services.
- Rotate admin API token regularly.
- Add audit logging to external storage before production use.
