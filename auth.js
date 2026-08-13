// APEX role-based access control
const AUTH_KEY = "apexAuthV1";
const USERS = {
  "apex admin": { role: "admin", name: "Apex Admin", passHash: "8c8e5a062482de8124b2016fbb9bfbeed33873c41bf3c4e99f304b77fc4ccb64" },
  "mani": { role: "supervisor", name: "Mani", passHash: "ffede868630e4e4acf9f46e18d6c926e35153553c8077f5cb20ae84b1b88ba36" },
  "prasanth": { role: "supervisor", name: "Prasanth", passHash: "aa1f26d2e58f122d775e6a49d01a13ac5ef72d813263836759ca8cda3e56d54e" }
};
let currentUser = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null");
const isAdmin = () => currentUser?.role === "admin";
const isSupervisor = () => currentUser?.role === "supervisor";
async function hashPassword(v){ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
function authScreen(){
  const root=document.getElementById("authRoot"); if(!root)return;
  root.innerHTML=`<div class="auth-card"><div class="brand-mark">A</div><h1>APEX Dream Builders</h1><p>Construction Management Portal</p><form id="loginForm"><label>Username<input id="loginUser" autocomplete="username" required placeholder="Enter username"></label><label>Password<input id="loginPass" type="password" autocomplete="current-password" required placeholder="Enter password"></label><button class="btn btn-primary" type="submit">Login</button><div id="loginError" class="auth-error"></div></form></div>`;
  root.classList.add("show");
  document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault(); const key=document.getElementById("loginUser").value.trim().toLowerCase(); const user=USERS[key]; const hash=await hashPassword(document.getElementById("loginPass").value); if(!user||hash!==user.passHash){document.getElementById("loginError").textContent="Invalid username or password.";return;} currentUser={role:user.role,name:user.name}; sessionStorage.setItem(AUTH_KEY,JSON.stringify(currentUser)); location.reload();});
}
function logout(){sessionStorage.removeItem(AUTH_KEY);currentUser=null;location.reload();}
function guardUI(){
  if(!currentUser){ authScreen(); document.querySelector(".app-shell")?.classList.add("locked"); return; }
  document.getElementById("authRoot")?.classList.remove("show");
  document.querySelector(".app-shell")?.classList.remove("locked");
  const badge=document.getElementById("userBadge"); if(badge) badge.textContent=`${currentUser.name} · ${currentUser.role === "admin" ? "Admin" : "Supervisor"}`;
  document.querySelectorAll('[data-admin-only]').forEach(el=>el.hidden=!isAdmin());
  if(isSupervisor()){
    document.querySelectorAll('.nav-item[data-section="supervisors"],.nav-item[data-section="reports"]').forEach(el=>el.hidden=true);
    document.querySelectorAll('[data-admin-only]').forEach(el=>el.hidden=true);
    filterSupervisorTables();
    const name=currentUser.name;
    const oldRD=window.renderDashboard;
    if(oldRD && !window.__apexDashboardWrapped){
      window.renderDashboard=function(){ const om=state.measurements,omat=state.materials,ol=state.labour; state.measurements=om.filter(x=>x.supervisor===name); state.materials=omat.filter(x=>x.supervisor===name); state.labour=ol.filter(x=>x.supervisor===name); oldRD(); state.measurements=om; state.materials=omat; state.labour=ol; };
      window.__apexDashboardWrapped=true;
    }
    renderAll();
  }
}
function filterSupervisorTables(){
  if(!isSupervisor()) return;
  const name=currentUser.name;
  const oldRM=window.renderMeasurements, oldRMat=window.renderMaterials, oldRL=window.renderLabour;
  window.renderMeasurements=function(){ const original=state.measurements; state.measurements=original.filter(x=>x.supervisor===name); oldRM(); state.measurements=original; };
  window.renderMaterials=function(){ const original=state.materials; state.materials=original.filter(x=>x.supervisor===name); oldRMat(); state.materials=original; };
  window.renderLabour=function(){ const original=state.labour; state.labour=original.filter(x=>x.supervisor===name); oldRL(); state.labour=original; };
}
const originalMeasurementForm=window.measurementForm, originalMaterialForm=window.materialForm, originalLabourForm=window.labourForm;
window.measurementForm=function(){ if(!currentUser)return authScreen(); originalMeasurementForm(); if(isSupervisor()){ const s=document.querySelector('#measurementForm select[name="supervisor"]'); if(s){s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;} } };
window.materialForm=function(){ if(!currentUser)return authScreen(); originalMaterialForm(); if(isSupervisor()){ const s=document.querySelector('#materialForm select[name="supervisor"]'); if(s){s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;} } };
window.labourForm=function(){ if(!currentUser)return authScreen(); originalLabourForm(); if(isSupervisor()){ const s=document.querySelector('#labourForm select[name="supervisor"]'); if(s){s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;} } };
const originalNavigate=window.navigate; window.navigate=function(section){ if(!currentUser)return authScreen(); if(isSupervisor()&&(section==="supervisors"||section==="reports")){showToast("This section is available to Admin only."); return;} originalNavigate(section); };
document.addEventListener("click",e=>{
  if(!currentUser){ e.preventDefault();e.stopPropagation();return; }
  const nav=e.target.closest('.nav-item'); if(nav&&isSupervisor()&&["supervisors","reports"].includes(nav.dataset.section)){e.preventDefault();e.stopImmediatePropagation();showToast("Admin access required.");return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(isSupervisor()&&["supervisor","export-csv","backup"].includes(action)){e.preventDefault();e.stopImmediatePropagation();showToast("Admin access required.");return;}
  const del=e.target.closest('[data-delete]'); if(del&&isSupervisor()){e.preventDefault();e.stopImmediatePropagation();showToast("Supervisors cannot delete records.");return;}
},true);
function addUserControls(){
  const top=document.querySelector('.top-actions'); if(!top||document.getElementById('userBadge'))return;
  top.insertAdjacentHTML('afterbegin',`<span class="user-badge" id="userBadge"></span><button class="btn btn-secondary" id="logoutBtn">Logout</button>`);
  document.getElementById('logoutBtn').addEventListener('click',logout);
}
function ensureConfiguredSupervisors(){
  [{name:"Mani"},{name:"Prasanth"}].forEach(u=>{ if(!state.supervisors.some(s=>s.name===u.name)){ state.supervisors.push({id:uid("sup_"),name:u.name,phone:"",sites:""}); } });
  localStorage.setItem(KEY,JSON.stringify(state));
}
window.exportCSV=function(){
  if(!isAdmin()){showToast("Admin access required.");return;}
  const rows=[["TYPE","DATE","SITE","DESCRIPTION","SUPERVISOR","CATEGORY","LENGTH","BREADTH","HEIGHT","QUANTITY","UNIT","RATE","TOTAL","NOTES"]];
  state.measurements.forEach(x=>rows.push(["MEASUREMENT",x.date,x.site,x.work,x.supervisor,"",x.length,x.breadth,x.height,x.quantity,x.unit,"","",x.notes]));
  state.materials.forEach(x=>rows.push(["MATERIAL",x.date,x.site,x.item,x.supervisor,"",x.qty,x.unit,x.rate,x.total,x.notes]));
  state.labour.forEach(x=>rows.push(["LABOUR",x.date,x.site,"",x.supervisor,x.category,x.count,"","","","","","",x.notes]));
  csvDownload("apex-construction-report.csv",rows);showToast("CSV report exported.");
};
window.addEventListener("DOMContentLoaded",()=>{ensureConfiguredSupervisors();addUserControls();guardUI();});
