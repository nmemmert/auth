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
- Set `ADMIN_API_TOKEN` in the root `.env` used by Docker Compose.
- Frontends ask for the token at runtime.
- Use Authelia access-control to gate these UIs to admin users only.

## Quick start (Docker)

1. Create a `.env` file next to `docker-compose.yml` (or copy from `.env.example`) with:

```env
AUTHELIA_USERS_FILE_HOST=/opt/authelia/users_database.yml
ADMIN_API_TOKEN=change-me
NODE_BACKEND_PORT=4100
NODE_FRONTEND_PORT=3100
PYTHON_BACKEND_PORT=5100
PYTHON_FRONTEND_PORT=3200
```

2. If your GHCR packages are private, login first:

```powershell
docker login ghcr.io
```

3. Start all services:

```powershell
docker compose pull
docker compose up -d
```

4. Open UIs:
   - Node UI: http://localhost:3100
   - Python UI: http://localhost:3200

## Connect this to Authelia

Point `AUTHELIA_USERS_FILE_HOST` to the same host file used by your Authelia container/service.

Example Authelia config snippet:

```yaml
authentication_backend:
  file:
   path: /config/users_database.yml
```

If Authelia maps that file from host `/opt/authelia/users_database.yml`, set:

```env
AUTHELIA_USERS_FILE_HOST=/opt/authelia/users_database.yml
```

Important notes:

- The admin backends write to `/data/users_database.yml` inside the container, which is your mapped Authelia users file on host.
- Run one admin backend at a time in production to reduce edit collisions on the same YAML file.
- Keep backups of your users file before major user/group updates.

## Build and push container images

### Local build and push

Run these commands on a machine with Docker installed:

```powershell
docker login ghcr.io
docker build -t ghcr.io/<owner>/auth-node-backend:latest ./node-stack/backend
docker build -t ghcr.io/<owner>/auth-node-frontend:latest ./node-stack/frontend
docker build -t ghcr.io/<owner>/auth-python-backend:latest ./python-stack/backend
docker build -t ghcr.io/<owner>/auth-python-frontend:latest ./python-stack/frontend
docker push ghcr.io/<owner>/auth-node-backend:latest
docker push ghcr.io/<owner>/auth-node-frontend:latest
docker push ghcr.io/<owner>/auth-python-backend:latest
docker push ghcr.io/<owner>/auth-python-frontend:latest
```

### GitHub Actions build and push

This repository includes a workflow at `.github/workflows/docker-publish.yml`.
It builds and pushes all 4 images to GHCR on pushes to main or when manually triggered.

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
