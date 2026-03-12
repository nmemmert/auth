import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAdminToken } from "./auth.js";
import {
  createUser,
  deleteUser,
  listGroups,
  listUsers,
  setPassword,
  updateUser
} from "./autheliaStore.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", requireAdminToken);

app.get("/api/users", async (_req, res) => {
  const users = await listUsers();
  res.json({ users });
});

app.get("/api/groups", async (_req, res) => {
  const groups = await listGroups();
  res.json({ groups });
});

app.post("/api/users", async (req, res) => {
  try {
    const user = await createUser(req.body || {});
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/users/:username", async (req, res) => {
  try {
    const user = await updateUser(req.params.username, req.body || {});
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/users/:username/password", async (req, res) => {
  try {
    await setPassword(req.params.username, req.body?.password);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/users/:username", async (req, res) => {
  try {
    await deleteUser(req.params.username);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 4100);
app.listen(port, () => {
  console.log(`Node backend listening on ${port}`);
});
