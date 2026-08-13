// APEX Dream Builders - role based access
const AUTH_KEY = "apexAuthV1";
const USERS = {
  "apex admin": { role: "admin", name: "Apex Admin", passHash: "8c8e5a062482de8124b2016fbb9bfbeed33873c41bf3c4e99f304b77fc4ccb64" },
  "mani": { role: "supervisor", name: "Mani", passHash: "ffede868630e4e4acf9f46e18d6c926e35153553c8077f5cb20ae84b1b88ba36" },
  "prasanth": { role: "supervisor", name: "Prasanth", passHash: "aa1f26d2e58f122d775e6a49d01a13ac5ef72d813263836759ca8cda3e56d54e" }
};
let currentUser = null;
try { currentUser = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null"); } catch(e) { currentUser = null; }
const isAdmin = () => currentUser?.role === "admin";
const isSupervisor = () => currentUser?.role === "supervisor";

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2,"0")).join("");
}

function authScreen() {
  const root = document.getElementById("authRoot");
  if (!root) return;
  root.innerHTML = `<div class="auth-card">
    <div class="brand-mark">A</div>
    <h1>APEX Dream Builders</h1>
    <p>Construction Management Portal</p>
    <form id="loginForm">
      <label>Username<input id="loginUser" autocomplete="username" required placeholder="Enter username"></label>
      <label>Password<input id="loginPass" type="password" autocomplete="current-password" required placeholder="Enter password"></label>
      <button class="btn btn-primary" type="submit">Login</button>
      <div id="loginError" class="auth-error"></div>
    </form>
  </div>`;
  root.classList.add("show");
  document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const error = document.getElementById("loginError");
    error.textContent = "Checking login...";
    try {
      const username = document.getElementById("loginUser").value.trim().toLowerCase();
      const password = document.getElementById("loginPass").value;
      const user = USERS[username];
      if (!user) { error.textContent = "Invalid username or password."; return; }
      const hash = await hashPassword(password);
      if (hash !== user.passHash) { error.textContent = "Invalid username or password."; return; }
      currentUser = { role: user.role, name: user.name };
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
      window.location.href = window.location.pathname + "?loggedin=1";
    } catch (err) {
      console.error("APEX login error", err);
      error.textContent = "Login error. Please refresh the page and try again.";
    }
  });
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  currentUser = null;
  window.location.href = window.location.pathname + "?logout=1";
}

function addUserControls() {
  const top = document.querySelector(".top-actions");
  if (!top || document.getElementById("userBadge")) return;
  top.insertAdjacentHTML("afterbegin", `<span class="user-badge" id="userBadge"></span><button class="btn btn-secondary" id="logoutBtn">Logout</button>`);
  document.getElementById("userBadge").textContent = `${currentUser.name} · ${isAdmin() ? "Admin" : "Supervisor"}`;
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

function ensureConfiguredSupervisors() {
  if (typeof state === "undefined") return;
  [{name:"Mani"},{name:"Prasanth"}].forEach(u => {
    if (!state.supervisors.some(s => s.name === u.name)) state.supervisors.push({id:uid("sup_"),name:u.name,phone:"",sites:""});
  });
  localStorage.setItem(KEY, JSON.stringify(state));
}

function applyRoleAccess() {
  if (!currentUser) { authScreen(); return; }
  document.getElementById("authRoot")?.classList.remove("show");
  addUserControls();
  if (isSupervisor()) {
    // Supervisors may use Dashboard, Measurements, Material Buying and Daily Labour only.
    document.querySelectorAll('.nav-item[data-section="supervisors"], .nav-item[data-section="reports"]').forEach(el => el.hidden = true);
    document.querySelectorAll('[data-action="quick-add"], [data-action="supervisor"], [data-action="export-csv"], [data-action="backup"]').forEach(el => el.hidden = true);
  }
}

function forceLoggedInSupervisor(formId) {
  if (!isSupervisor()) return;
  const form = document.getElementById(formId);
  if (!form) return;
  const select = form.querySelector('select[name="supervisor"]');
  if (select) {
    select.value = currentUser.name;
    select.innerHTML = `<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;
  }
}

// Enforce permissions before the original app.js click handler receives the event.
document.addEventListener("click", function(e) {
  if (!currentUser) return;
  if (!isSupervisor()) return;

  const nav = e.target.closest(".nav-item");
  if (nav && ["supervisors", "reports"].includes(nav.dataset.section)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    showToast("Admin access required.");
    return;
  }

  const actionEl = e.target.closest("[data-action]");
  const action = actionEl?.dataset.action;
  if (["supervisor", "export-csv", "backup", "quick-add"].includes(action)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    showToast("Supervisor can add only Measurement, Material Buying and Daily Labour.");
    return;
  }

  const del = e.target.closest("[data-delete]");
  if (del) {
    e.preventDefault();
    e.stopImmediatePropagation();
    showToast("Supervisors cannot delete records.");
  }
}, true);

// Force the logged-in supervisor name into all three allowed submissions.
document.addEventListener("submit", function(e) {
  if (!isSupervisor()) return;
  const form = e.target;
  if (["measurementForm", "materialForm", "labourForm"].includes(form.id)) {
    const select = form.querySelector('select[name="supervisor"]');
    if (select) select.value = currentUser.name;
  }
}, true);

window.addEventListener("DOMContentLoaded", function() {
  if (currentUser) ensureConfiguredSupervisors();
  applyRoleAccess();
});
