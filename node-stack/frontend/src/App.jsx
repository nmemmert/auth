import { useMemo, useState } from "react";

const defaultUser = {
  username: "",
  displayname: "",
  email: "",
  groups: "",
  password: "",
  disabled: false
};

export function App() {
  const [apiBase, setApiBase] = useState("http://172.16.16.106:4100");
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(defaultUser);
  const [selected, setSelected] = useState("");
  const [passwordReset, setPasswordReset] = useState("");
  const [message, setMessage] = useState("");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "x-admin-token": token
  }), [token]);

  async function loadUsers() {
    const response = await fetch(`${apiBase}/api/users`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load users");
    setUsers(data.users || []);
  }

  async function createUser(event) {
    event.preventDefault();
    const payload = {
      username: form.username.trim(),
      displayname: form.displayname.trim(),
      email: form.email.trim(),
      groups: form.groups.split(",").map((g) => g.trim()).filter(Boolean),
      password: form.password,
      disabled: form.disabled
    };

    const response = await fetch(`${apiBase}/api/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to create user");

    setMessage(`Created ${data.user.username}`);
    setForm(defaultUser);
    await loadUsers();
  }

  async function toggleUser(username, disabled) {
    const existing = users.find((u) => u.username === username);
    if (!existing) return;
    const response = await fetch(`${apiBase}/api/users/${username}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        displayname: existing.displayname,
        email: existing.email,
        groups: existing.groups,
        disabled
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update user");
    setMessage(`Updated ${username}`);
    await loadUsers();
  }

  async function removeUser(username) {
    const response = await fetch(`${apiBase}/api/users/${username}`, {
      method: "DELETE",
      headers
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to delete user");
    setMessage(`Deleted ${username}`);
    await loadUsers();
  }

  async function resetPassword(event) {
    event.preventDefault();
    if (!selected) throw new Error("Select a user first");
    const response = await fetch(`${apiBase}/api/users/${selected}/password`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password: passwordReset })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to reset password");
    setMessage(`Password reset for ${selected}`);
    setPasswordReset("");
  }

  return (
    <main className="page">
      <h1>Authelia File Auth Admin (Node Stack)</h1>
      <p className="note">Use an admin API token and point to your backend.</p>

      <section className="panel">
        <label>API Base URL</label>
        <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
        <label>Admin Token</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} type="password" />
        <button onClick={() => loadUsers().catch((e) => setMessage(e.message))}>Load Users</button>
      </section>

      <section className="panel">
        <h2>Create User</h2>
        <form onSubmit={(e) => createUser(e).catch((err) => setMessage(err.message))}>
          <input placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input placeholder="display name" value={form.displayname} onChange={(e) => setForm({ ...form, displayname: e.target.value })} />
          <input placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="groups (comma separated)" value={form.groups} onChange={(e) => setForm({ ...form, groups: e.target.value })} />
          <input placeholder="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <label><input type="checkbox" checked={form.disabled} onChange={(e) => setForm({ ...form, disabled: e.target.checked })} />disabled</label>
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <h2>Users</h2>
        <ul>
          {users.map((u) => (
            <li key={u.username}>
              <span>{u.username} ({u.groups.join(",") || "no groups"}) {u.disabled ? "[disabled]" : ""}</span>
              <button onClick={() => setSelected(u.username)}>Select</button>
              <button onClick={() => toggleUser(u.username, !u.disabled).catch((e) => setMessage(e.message))}>
                {u.disabled ? "Enable" : "Disable"}
              </button>
              <button onClick={() => removeUser(u.username).catch((e) => setMessage(e.message))}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Password Reset</h2>
        <form onSubmit={(e) => resetPassword(e).catch((err) => setMessage(err.message))}>
          <p>Selected user: {selected || "none"}</p>
          <input placeholder="new password" type="password" value={passwordReset} onChange={(e) => setPasswordReset(e.target.value)} />
          <button type="submit">Reset Password</button>
        </form>
      </section>

      {message ? <p className="message">{message}</p> : null}
    </main>
  );
}
