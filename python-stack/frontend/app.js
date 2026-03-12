const state = {
  selected: "",
  users: []
};

function apiBase() {
  return document.getElementById("apiBase").value.trim();
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-admin-token": document.getElementById("token").value
  };
}

function setMessage(message) {
  document.getElementById("message").innerText = message;
}

function renderUsers() {
  const usersEl = document.getElementById("users");
  usersEl.innerHTML = "";

  state.users.forEach((user) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.innerText = `${user.username} (${(user.groups || []).join(",") || "no groups"}) ${user.disabled ? "[disabled]" : ""}`;

    const selectButton = document.createElement("button");
    selectButton.innerText = "Select";
    selectButton.onclick = () => {
      state.selected = user.username;
      document.getElementById("selectedUser").innerText = `Selected user: ${state.selected}`;
    };

    const toggleButton = document.createElement("button");
    toggleButton.innerText = user.disabled ? "Enable" : "Disable";
    toggleButton.onclick = async () => {
      try {
        await fetch(`${apiBase()}/api/users/${user.username}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({
            displayname: user.displayname,
            email: user.email,
            groups: user.groups,
            disabled: !user.disabled
          })
        }).then(assertOk);
        await loadUsers();
      } catch (error) {
        setMessage(error.message);
      }
    };

    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.onclick = async () => {
      try {
        await fetch(`${apiBase()}/api/users/${user.username}`, {
          method: "DELETE",
          headers: headers()
        }).then(assertOk);
        await loadUsers();
      } catch (error) {
        setMessage(error.message);
      }
    };

    li.appendChild(text);
    li.appendChild(selectButton);
    li.appendChild(toggleButton);
    li.appendChild(deleteButton);
    usersEl.appendChild(li);
  });
}

async function assertOk(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || "request failed");
  }
  return data;
}

async function loadUsers() {
  const data = await fetch(`${apiBase()}/api/users`, { headers: headers() }).then(assertOk);
  state.users = data.users || [];
  renderUsers();
  setMessage("Users loaded");
}

document.getElementById("loadBtn").onclick = () => {
  loadUsers().catch((error) => setMessage(error.message));
};

document.getElementById("createForm").onsubmit = async (event) => {
  event.preventDefault();
  try {
    const payload = {
      username: document.getElementById("username").value.trim(),
      displayname: document.getElementById("displayname").value.trim(),
      email: document.getElementById("email").value.trim(),
      groups: document.getElementById("groups").value.split(",").map((g) => g.trim()).filter(Boolean),
      password: document.getElementById("password").value,
      disabled: document.getElementById("disabled").checked
    };
    await fetch(`${apiBase()}/api/users`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    }).then(assertOk);
    await loadUsers();
    setMessage(`Created ${payload.username}`);
    event.target.reset();
  } catch (error) {
    setMessage(error.message);
  }
};

document.getElementById("passwordForm").onsubmit = async (event) => {
  event.preventDefault();
  if (!state.selected) {
    setMessage("Select a user first");
    return;
  }
  try {
    await fetch(`${apiBase()}/api/users/${state.selected}/password`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ password: document.getElementById("newPassword").value })
    }).then(assertOk);
    setMessage(`Password reset for ${state.selected}`);
    event.target.reset();
  } catch (error) {
    setMessage(error.message);
  }
};
