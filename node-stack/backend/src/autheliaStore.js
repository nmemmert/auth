import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import argon2 from "argon2";
import YAML from "yaml";

const DEFAULT_FILE_CONTENT = "users: {}\n";

function getUsersFile() {
  return process.env.AUTHELIA_USERS_FILE || "../../data/users_database.yml";
}

async function ensureFileExists(filePath) {
  await fs.mkdir(dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, DEFAULT_FILE_CONTENT, "utf8");
  }
}

async function loadDatabase() {
  const filePath = getUsersFile();
  await ensureFileExists(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = YAML.parse(raw) || {};
  if (!parsed.users || typeof parsed.users !== "object") {
    parsed.users = {};
  }
  return { filePath, data: parsed };
}

async function saveDatabase(filePath, data) {
  const backupPath = `${filePath}.bak`;
  const tempPath = `${filePath}.tmp`;
  const payload = YAML.stringify(data);

  await fs.copyFile(filePath, backupPath).catch(() => {});
  await fs.writeFile(tempPath, payload, "utf8");
  await fs.rename(tempPath, filePath);
}

function sanitizeUser(username, user) {
  return {
    username,
    disabled: Boolean(user.disabled),
    displayname: user.displayname || "",
    email: user.email || "",
    groups: Array.isArray(user.groups) ? user.groups : []
  };
}

export async function listUsers() {
  const { data } = await loadDatabase();
  return Object.entries(data.users).map(([username, user]) => sanitizeUser(username, user));
}

export async function listGroups() {
  const users = await listUsers();
  const groups = new Set();
  users.forEach((u) => u.groups.forEach((g) => groups.add(g)));
  return Array.from(groups).sort((a, b) => a.localeCompare(b));
}

export async function createUser(input) {
  const { filePath, data } = await loadDatabase();
  const username = input.username;
  if (!username) throw new Error("username is required");
  if (data.users[username]) throw new Error("username already exists");
  if (!input.password) throw new Error("password is required");

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  data.users[username] = {
    disabled: Boolean(input.disabled),
    displayname: input.displayname || username,
    password: passwordHash,
    email: input.email || "",
    groups: Array.isArray(input.groups) ? input.groups : []
  };

  await saveDatabase(filePath, data);
  return sanitizeUser(username, data.users[username]);
}

export async function updateUser(username, input) {
  const { filePath, data } = await loadDatabase();
  const user = data.users[username];
  if (!user) throw new Error("user not found");

  user.disabled = Boolean(input.disabled);
  user.displayname = input.displayname || user.displayname || username;
  user.email = input.email || "";
  user.groups = Array.isArray(input.groups) ? input.groups : [];

  await saveDatabase(filePath, data);
  return sanitizeUser(username, user);
}

export async function setPassword(username, password) {
  const { filePath, data } = await loadDatabase();
  const user = data.users[username];
  if (!user) throw new Error("user not found");
  if (!password) throw new Error("password is required");

  user.password = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  await saveDatabase(filePath, data);
  return true;
}

export async function deleteUser(username) {
  const { filePath, data } = await loadDatabase();
  if (!data.users[username]) throw new Error("user not found");
  delete data.users[username];
  await saveDatabase(filePath, data);
  return true;
}
