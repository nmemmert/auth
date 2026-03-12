from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import PasswordReset, UserCreate, UserUpdate
from .store import create_user, delete_user, list_groups, list_users, set_password, update_user

load_dotenv()
app = FastAPI(title="Authelia File Admin Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_admin_token(x_admin_token: str = Header(default="")) -> None:
    configured = os.getenv("ADMIN_API_TOKEN", "")
    if not configured:
        raise HTTPException(status_code=500, detail="ADMIN_API_TOKEN is not configured")
    if x_admin_token != configured:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/users", dependencies=[Depends(require_admin_token)])
def api_list_users() -> dict:
    return {"users": list_users()}


@app.get("/api/groups", dependencies=[Depends(require_admin_token)])
def api_list_groups() -> dict:
    return {"groups": list_groups()}


@app.post("/api/users", dependencies=[Depends(require_admin_token)])
def api_create_user(payload: UserCreate) -> dict:
    try:
        user = create_user(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"user": user}


@app.put("/api/users/{username}", dependencies=[Depends(require_admin_token)])
def api_update_user(username: str, payload: UserUpdate) -> dict:
    try:
        user = update_user(username, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"user": user}


@app.put("/api/users/{username}/password", dependencies=[Depends(require_admin_token)])
def api_set_password(username: str, payload: PasswordReset) -> dict:
    try:
        set_password(username, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}


@app.delete("/api/users/{username}", dependencies=[Depends(require_admin_token)])
def api_delete_user(username: str) -> dict:
    try:
        delete_user(username)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}
