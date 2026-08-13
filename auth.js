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
const SUPERVISOR_ALLOWED_ACTIONS = new Set(["measurement","material","labour","close-modal"]);
const SUPERVISOR_ALLOWED_SECTIONS = new Set(["dashboard","measurements","materials","labour"]);

async function hashPassword(value) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2,"0")).join("");
}

function authScreen() {
  const root = document.getElementById("authRoot");
  if (!root) return;
  root.innerHTML = `<div class="auth-card"><div class="brand-mark">A</div><h1>APEX Dream Builders</h1><p>Construction Management Portal</p><form id="loginForm"><label>Username<input id="loginUser" autocomplete="username" required placeholder="Enter username"></label><label>Password<input id="loginPass" type="password" autocomplete="current-password" required placeholder="Enter password"></label><button class="btn btn-primary" type="submit">Login</button><div id="loginError" class="auth-error"></div></form></div>`;
  root.classList.add("show");
  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const error=document.getElementById("loginError");
    try {
      const username=document.getElementById("loginUser").value.trim().toLowerCase();
      const user=USERS[username];
      if(!user || await hashPassword(document.getElementById("loginPass").value)!==user.passHash){ error.textContent="Invalid username or password."; return; }
      currentUser={role:user.role,name:user.name};
      sessionStorage.setItem(AUTH_KEY,JSON.stringify(currentUser));
      window.location.href=window.location.pathname+"?loggedin=1";
    } catch(err) { console.error(err); error.textContent="Login error. Please refresh and try again."; }
  });
}
function logout(){ sessionStorage.removeItem(AUTH_KEY); currentUser=null; window.location.href=window.location.pathname+"?logout=1"; }

function addUserControls(){
  const top=document.querySelector(".top-actions");
  if(!top || document.getElementById("userBadge")) return;
  top.insertAdjacentHTML("afterbegin",`<span class="user-badge" id="userBadge"></span><button class="btn btn-secondary" id="logoutBtn">Logout</button>`);
  document.getElementById("userBadge").textContent=`${currentUser.name} · ${isAdmin()?"Admin":"Supervisor"}`;
  document.getElementById("logoutBtn").addEventListener("click",logout);
}
function ensureConfiguredSupervisors(){
  if(typeof state==="undefined") return;
  [{name:"Mani"},{name:"Prasanth"}].forEach(u=>{if(!state.supervisors.some(s=>s.name===u.name))state.supervisors.push({id:uid("sup_"),name:u.name,phone:"",sites:""});});
  localStorage.setItem(KEY,JSON.stringify(state));
}
function forceLoggedInSupervisor(formId){
  if(!isSupervisor()) return;
  const form=document.getElementById(formId); if(!form)return;
  const select=form.querySelector('select[name="supervisor"]');
  if(select) select.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;
}
function applyRoleAccess(){
  if(!currentUser){authScreen();return;}
  document.getElementById("authRoot")?.classList.remove("show");
  addUserControls();
  if(!isSupervisor()) return;
  // Supervisor UI: Dashboard + the three allowed entry areas only.
  document.querySelectorAll('.nav-item').forEach(el=>{el.hidden=!SUPERVISOR_ALLOWED_SECTIONS.has(el.dataset.section);});
  document.querySelectorAll('.section').forEach(el=>{if(!SUPERVISOR_ALLOWED_SECTIONS.has(el.id))el.hidden=true;});
  document.querySelectorAll('[data-action="quick-add"],[data-action="supervisor"],[data-action="export-csv"],[data-action="backup"]').forEach(el=>el.hidden=true);
  document.querySelectorAll('[data-delete]').forEach(el=>el.hidden=true);
  // Hide any future admin-only controls added dynamically.
  new MutationObserver(()=>{
    document.querySelectorAll('.nav-item').forEach(el=>{el.hidden=!SUPERVISOR_ALLOWED_SECTIONS.has(el.dataset.section);});
    document.querySelectorAll('.section').forEach(el=>{if(!SUPERVISOR_ALLOWED_SECTIONS.has(el.id))el.hidden=true;});
    document.querySelectorAll('[data-action="quick-add"],[data-action="supervisor"],[data-action="export-csv"],[data-action="backup"],[data-delete]').forEach(el=>el.hidden=true);
  }).observe(document.body,{subtree:true,childList:true});
}

// Capture clicks before app.js receives them.
document.addEventListener("click",e=>{
  if(!currentUser || !isSupervisor()) return;
  const nav=e.target.closest(".nav-item");
  if(nav && !SUPERVISOR_ALLOWED_SECTIONS.has(nav.dataset.section)){e.preventDefault();e.stopImmediatePropagation();showToast("Admin access required.");return;}
  const actionEl=e.target.closest("[data-action]");
  const action=actionEl?.dataset.action;
  if(action && !SUPERVISOR_ALLOWED_ACTIONS.has(action)){e.preventDefault();e.stopImmediatePropagation();showToast("Supervisor can add only Measurement, Material Buying and Daily Labour.");return;}
  const del=e.target.closest("[data-delete]");
  if(del){e.preventDefault();e.stopImmediatePropagation();showToast("Supervisors cannot delete records.");return;}
},{capture:true});

// Ensure supervisor identity cannot be changed in the three allowed forms.
document.addEventListener("submit",e=>{
  if(!isSupervisor())return;
  if(["measurementForm","materialForm","labourForm"].includes(e.target.id)){
    const select=e.target.querySelector('select[name="supervisor"]');
    if(select) select.value=currentUser.name;
  }
},{capture:true});

window.addEventListener("DOMContentLoaded",()=>{if(currentUser)ensureConfiguredSupervisors();applyRoleAccess();});
