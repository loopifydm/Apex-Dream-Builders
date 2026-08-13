// APEX role-based access control
const AUTH_KEY = "apexAuthV1";
// Demo credentials for the current GitHub Pages version.
// Change these before using the portal for real production data.
const USERS = {
  "apex admin": { role: "admin", name: "Apex Admin", passHash: "aa7079615177d0432fedbfdeb5af227ebfc181b6165768b7fefca5c8058658d3" },
  "mani": { role: "supervisor", name: "Mani", passHash: "a1e57a3145569880bc8f57c3b3756a0f1834bc992dadf938ee6dc1a0e534077b" },
  "prasanth": { role: "supervisor", name: "Prasanth", passHash: "0118cf96252277d29e0f64aac37b01ba08ec0e2e04b2a93a3d616d4a9e1f0d65" }
};
let currentUser = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null");
const isAdmin = () => currentUser?.role === "admin";
const isSupervisor = () => currentUser?.role === "supervisor";
async function hashPassword(v){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function authScreen(){
  const root=document.getElementById("authRoot"); if(!root)return;
  root.innerHTML=`<div class="auth-card"><div class="brand-mark">A</div><h1>APEX Dream Builders</h1><p>Construction Management Portal</p><form id="loginForm"><label>Username<input id="loginUser" autocomplete="username" required placeholder="Enter username"></label><label>Password<input id="loginPass" type="password" autocomplete="current-password" required placeholder="Enter password"></label><button class="btn btn-primary" type="submit">Login</button><div id="loginError" class="auth-error"></div></form></div>`;
  root.classList.add("show");
  const form=document.getElementById("loginForm");
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const key=document.getElementById("loginUser").value.trim().toLowerCase();
    const password=document.getElementById("loginPass").value;
    const user=USERS[key];
    try{
      const hash=await hashPassword(password);
      if(!user||hash!==user.passHash){document.getElementById("loginError").textContent="Invalid username or password.";return;}
      currentUser={role:user.role,name:user.name};
      sessionStorage.setItem(AUTH_KEY,JSON.stringify(currentUser));
      location.reload();
    }catch(err){document.getElementById("loginError").textContent="Login could not be processed. Please refresh and try again.";}
  });
}
function logout(){sessionStorage.removeItem(AUTH_KEY);currentUser=null;location.reload();}
function guardUI(){
  if(!currentUser){authScreen();return;}
  document.getElementById("authRoot")?.classList.remove("show");
  const badge=document.getElementById("userBadge"); if(badge) badge.textContent=`${currentUser.name} · ${currentUser.role === "admin" ? "Admin" : "Supervisor"}`;
  document.querySelectorAll('[data-admin-only]').forEach(el=>el.hidden=!isAdmin());
  if(isSupervisor()){
    document.querySelectorAll('.nav-item[data-section="supervisors"],.nav-item[data-section="reports"]').forEach(el=>el.hidden=true);
    filterSupervisorTables();
    const name=currentUser.name;
    const oldRD=window.renderDashboard;
    if(oldRD && !window.__apexDashboardWrapped){
      window.renderDashboard=function(){
        const om=state.measurements,omat=state.materials,ol=state.labour;
        state.measurements=om.filter(x=>x.supervisor===name);state.materials=omat.filter(x=>x.supervisor===name);state.labour=ol.filter(x=>x.supervisor===name);
        oldRD();state.measurements=om;state.materials=omat;state.labour=ol;
      }; window.__apexDashboardWrapped=true;
    }
    renderAll();
  }
}
function filterSupervisorTables(){
  if(!isSupervisor())return;
  const name=currentUser.name;
  const oldRM=window.renderMeasurements,oldRMat=window.renderMaterials,oldRL=window.renderLabour;
  window.renderMeasurements=function(){const original=state.measurements;state.measurements=original.filter(x=>x.supervisor===name);oldRM();state.measurements=original;};
  window.renderMaterials=function(){const original=state.materials;state.materials=original.filter(x=>x.supervisor===name);oldRMat();state.materials=original;};
  window.renderLabour=function(){const original=state.labour;state.labour=original.filter(x=>x.supervisor===name);oldRL();state.labour=original;};
}
const originalMeasurementForm=window.measurementForm,originalMaterialForm=window.materialForm,originalLabourForm=window.labourForm;
window.measurementForm=function(){if(!currentUser)return authScreen();originalMeasurementForm();if(isSupervisor()){const s=document.querySelector('#measurementForm select[name="supervisor"]');if(s)s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;}};
window.materialForm=function(){if(!currentUser)return authScreen();originalMaterialForm();if(isSupervisor()){const s=document.querySelector('#materialForm select[name="supervisor"]');if(s)s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;}};
window.labourForm=function(){if(!currentUser)return authScreen();originalLabourForm();if(isSupervisor()){const s=document.querySelector('#labourForm select[name="supervisor"]');if(s)s.innerHTML=`<option selected value="${esc(currentUser.name)}">${esc(currentUser.name)} (Logged in)</option>`;}};
const originalNavigate=window.navigate;
window.navigate=function(section){if(!currentUser)return authScreen();if(isSupervisor()&&(section==="supervisors"||section==="reports")){showToast("This section is available to Admin only.");return;}originalNavigate(section);};
document.addEventListener("click",e=>{
  if(!currentUser){e.preventDefault();e.stopImmediatePropagation();return;}
  const nav=e.target.closest('.nav-item');if(nav&&isSupervisor()&&["supervisors","reports"].includes(nav.dataset.section)){e.preventDefault();e.stopImmediatePropagation();showToast("Admin access required.");return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(isSupervisor()&&["supervisor","export-csv","backup"].includes(action)){e.preventDefault();e.stopImmediatePropagation();showToast("Admin access required.");return;}
  const del=e.target.closest('[data-delete]');if(del&&isSupervisor()){e.preventDefault();e.stopImmediatePropagation();showToast("Supervisors cannot delete records.");return;}
},true);
function addUserControls(){
  const top=document.querySelector('.top-actions');if(!top||document.getElementById('userBadge'))return;
  top.insertAdjacentHTML('afterbegin',`<span class="user-badge" id="userBadge"></span><button class="btn btn-secondary" id="logoutBtn">Logout</button>`);
  document.getElementById('logoutBtn').addEventListener('click',logout);
}
function ensureConfiguredSupervisors(){
  [{name:"Mani"},{name:"Prasanth"}].forEach(u=>{if(!state.supervisors.some(s=>s.name===u.name))state.supervisors.push({id:uid("sup_"),name:u.name,phone:"",sites:""});});
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
