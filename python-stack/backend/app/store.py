from __future__ import annotations

import os
import shutil
from pathlib import Path

import yaml
from argon2 import PasswordHasher

DEFAULT_CONTENT = "users: {}\n"
PASSWORD_HASHER = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)


def users_file() -> Path:
    return Path(os.getenv("AUTHELIA_USERS_FILE", "../../data/users_database.yml"))


def ensure_file(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(DEFAULT_CONTENT, encoding="utf-8")


def load_db() -> tuple[Path, dict]:
    path = users_file()
    ensure_file(path)
    parsed = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(parsed.get("users"), dict):
        parsed["users"] = {}
    return path, parsed


def save_db(path: Path, data: dict) -> None:
    temp = path.with_suffix(path.suffix + ".tmp")
    backup = path.with_suffix(path.suffix + ".bak")
    if path.exists():
        shutil.copy2(path, backup)
    temp.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    temp.replace(path)


def sanitize(username: str, user: dict) -> dict:
    return {
        "username": username,
        "displayname": user.get("displayname", ""),
        "email": user.get("email", ""),
        "groups": user.get("groups", []),
        "disabled": bool(user.get("disabled", False)),
    }


def list_users() -> list[dict]:
    _, data = load_db()
    return [sanitize(username, user) for username, user in data["users"].items()]


def list_groups() -> list[str]:
    groups = set()
    for user in list_users():
        for group in user.get("groups", []):
            groups.add(group)
    return sorted(groups)


def create_user(payload: dict) -> dict:
    path, data = load_db()
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    if not username:
        raise ValueError("username is required")
    if username in data["users"]:
        raise ValueError("username already exists")
    if not password:
        raise ValueError("password is required")

    data["users"][username] = {
        "displayname": payload.get("displayname") or username,
        "email": payload.get("email", ""),
        "groups": payload.get("groups", []),
        "disabled": bool(payload.get("disabled", False)),
        "password": PASSWORD_HASHER.hash(password),
    }
    save_db(path, data)
    return sanitize(username, data["users"][username])


def update_user(username: str, payload: dict) -> dict:
    path, data = load_db()
    user = data["users"].get(username)
    if not user:
        raise ValueError("user not found")

    user["displayname"] = payload.get("displayname") or user.get("displayname") or username
    user["email"] = payload.get("email", "")
    user["groups"] = payload.get("groups", [])
    user["disabled"] = bool(payload.get("disabled", False))

    save_db(path, data)
    return sanitize(username, user)


def set_password(username: str, password: str) -> None:
    path, data = load_db()
    user = data["users"].get(username)
    if not user:
        raise ValueError("user not found")
    if not password:
        raise ValueError("password is required")
    user["password"] = PASSWORD_HASHER.hash(password)
    save_db(path, data)


def delete_user(username: str) -> None:
    path, data = load_db()
    if username not in data["users"]:
        raise ValueError("user not found")
    del data["users"][username]
    save_db(path, data)
