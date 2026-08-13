const KEY = "apexConstructionDataV1";

const state = loadState();

function todayISO(){ return new Date().toISOString().slice(0,10); }
function uid(prefix){ return prefix + Date.now() + Math.random().toString(16).slice(2); }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
function money(v){ return "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:2}); }
function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(saved) return saved;
  }catch(e){}
  return {
    measurements:[], materials:[], labour:[],
    supervisors:[
      {id:uid("sup_"),name:"Site Supervisor 1",phone:"",sites:""}
    ]
  };
}
function save(){ localStorage.setItem(KEY,JSON.stringify(state)); renderAll(); }
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
function openModal(title, body){
  document.getElementById("modal").innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="modal-close" data-action="close-modal">×</button></div>${body}`;
  document.getElementById("modalBackdrop").classList.add("show");
}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("show");}
function supervisorsOptions(selected=""){
  return `<option value="">Select supervisor</option>`+state.supervisors.map(s=>`<option ${s.name===selected?"selected":""} value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
}
function siteOptions(type, selected=""){
  const arr=[...new Set(state[type].map(x=>x.site).filter(Boolean))];
  return `<option value="">All sites</option>`+arr.map(s=>`<option ${s===selected?"selected":""}>${esc(s)}</option>`).join("");
}

function navigate(section){
  document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===section));
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.section===section));
  const title=document.querySelector(`[data-section="${section}"] span`)?.textContent || section;
  document.getElementById("pageTitle").textContent=title;
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function calculateMeasurement(){
  const l=+document.getElementById("mLength")?.value||0;
  const b=+document.getElementById("mBreadth")?.value||0;
  const h=+document.getElementById("mHeight")?.value||0;
  const factor=document.getElementById("mFormula")?.value||"area";
  let q=0;
  if(factor==="volume") q=l*b*h;
  else if(factor==="length") q=l;
  else q=l*b;
  const el=document.getElementById("calcValue"); if(el) el.textContent=q.toFixed(2);
}

function measurementForm(){
  openModal("New Site Measurement",`<form class="form" id="measurementForm">
    <div class="form-grid">
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}" required></div>
      <div class="field"><label>Site / Project</label><input name="site" placeholder="e.g. Green Villa, Peelamedu" required></div>
      <div class="field full"><label>Work / Measurement Description</label><input name="work" placeholder="e.g. Ground floor brickwork" required></div>
      <div class="field"><label>Supervisor</label><select name="supervisor" required>${supervisorsOptions()}</select></div>
      <div class="field"><label>Unit</label><select name="unit"><option>sq.ft</option><option>sq.m</option><option>cu.ft</option><option>cu.m</option><option>r.ft</option><option>nos</option></select></div>
      <div class="field"><label>Length</label><input id="mLength" name="length" type="number" step="0.01" min="0" value="0"></div>
      <div class="field"><label>Breadth</label><input id="mBreadth" name="breadth" type="number" step="0.01" min="0" value="0"></div>
      <div class="field"><label>Height / Depth</label><input id="mHeight" name="height" type="number" step="0.01" min="0" value="0"></div>
      <div class="field"><label>Calculation</label><select id="mFormula" name="formula"><option value="area">Length × Breadth</option><option value="volume">Length × Breadth × Height</option><option value="length">Length only</option></select></div>
      <div class="field full"><div class="calculated">Calculated Quantity: <strong id="calcValue">0.00</strong></div></div>
      <div class="field full"><label>Notes</label><textarea name="notes" placeholder="Additional site notes..."></textarea></div>
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary">Save Measurement</button></div>
  </form>`);
  ["mLength","mBreadth","mHeight","mFormula"].forEach(id=>document.getElementById(id)?.addEventListener("input",calculateMeasurement));
  document.getElementById("measurementForm").addEventListener("submit",e=>{
    e.preventDefault(); const f=new FormData(e.target); calculateMeasurement();
    const length=+f.get("length")||0,breadth=+f.get("breadth")||0,height=+f.get("height")||0,formula=f.get("formula");
    const quantity=formula==="volume"?length*breadth*height:formula==="length"?length:length*breadth;
    state.measurements.unshift({id:uid("m_"),date:f.get("date"),site:f.get("site"),work:f.get("work"),supervisor:f.get("supervisor"),unit:f.get("unit"),length,breadth,height,formula,quantity,notes:f.get("notes")});
    save();closeModal();showToast("Measurement saved successfully.");
  });
}

function materialForm(){
  openModal("New Material Purchase",`<form class="form" id="materialForm">
    <div class="form-grid">
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}" required></div>
      <div class="field"><label>Site / Project</label><input name="site" placeholder="Project name" required></div>
      <div class="field full"><label>Material</label><input name="item" placeholder="e.g. M-Sand, Cement, Steel" required></div>
      <div class="field"><label>Supplier</label><input name="supplier" placeholder="Supplier name"></div>
      <div class="field"><label>Invoice / Bill No.</label><input name="invoice" placeholder="Optional"></div>
      <div class="field"><label>Quantity</label><input id="matQty" name="qty" type="number" step="0.01" min="0" required></div>
      <div class="field"><label>Unit</label><select name="unit"><option>bags</option><option>kg</option><option>ton</option><option>cu.ft</option><option>cu.m</option><option>nos</option><option>litre</option></select></div>
      <div class="field"><label>Rate / Unit (₹)</label><input id="matRate" name="rate" type="number" step="0.01" min="0" required></div>
      <div class="field"><label>Total Amount</label><div class="calculated"><strong id="matTotal">₹0</strong></div></div>
      <div class="field"><label>Purchased By</label><input name="buyer" placeholder="Name"></div>
      <div class="field"><label>Supervisor</label><select name="supervisor">${supervisorsOptions()}</select></div>
      <div class="field full"><label>Notes</label><textarea name="notes"></textarea></div>
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary">Save Purchase</button></div>
  </form>`);
  const update=()=>{document.getElementById("matTotal").textContent=money((+document.getElementById("matQty").value||0)*(+document.getElementById("matRate").value||0));};
  ["matQty","matRate"].forEach(id=>document.getElementById(id).addEventListener("input",update));
  document.getElementById("materialForm").addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target),qty=+f.get("qty")||0,rate=+f.get("rate")||0;
    state.materials.unshift({id:uid("mat_"),date:f.get("date"),site:f.get("site"),item:f.get("item"),supplier:f.get("supplier"),invoice:f.get("invoice"),qty,unit:f.get("unit"),rate,total:qty*rate,buyer:f.get("buyer"),supervisor:f.get("supervisor"),notes:f.get("notes")});
    save();closeModal();showToast("Material purchase saved.");
  });
}

function labourForm(){
  openModal("Daily Labour Entry",`<form class="form" id="labourForm">
    <div class="form-grid">
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}" required></div>
      <div class="field"><label>Site / Project</label><input name="site" placeholder="Project name" required></div>
      <div class="field"><label>Supervisor Name</label><select name="supervisor" required>${supervisorsOptions()}</select></div>
      <div class="field"><label>Shift</label><select name="shift"><option>Full Day</option><option>Morning</option><option>Evening</option><option>Night</option></select></div>
      <div class="field"><label>Labour Category</label><select name="category"><option>Mason</option><option>Helper</option><option>Carpenter</option><option>Plumber</option><option>Electrician</option><option>Painter</option><option>Steel Fixer</option><option>Machine Operator</option><option>Other</option></select></div>
      <div class="field"><label>Worker Count</label><input name="count" type="number" min="0" step="1" required></div>
      <div class="field full"><label>Work / Notes</label><textarea name="notes" placeholder="Today's work or remarks..."></textarea></div>
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary">Save Labour Entry</button></div>
  </form>`);
  document.getElementById("labourForm").addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target);
    state.labour.unshift({id:uid("l_"),date:f.get("date"),site:f.get("site"),supervisor:f.get("supervisor"),shift:f.get("shift"),category:f.get("category"),count:+f.get("count")||0,notes:f.get("notes")});
    save();closeModal();showToast("Daily labour entry saved.");
  });
}
function supervisorForm(){
  openModal("Add Supervisor",`<form class="form" id="supervisorForm">
    <div class="form-grid">
      <div class="field full"><label>Supervisor Name</label><input name="name" required placeholder="Full name"></div>
      <div class="field"><label>Phone</label><input name="phone" placeholder="Optional"></div>
      <div class="field"><label>Assigned Sites</label><input name="sites" placeholder="e.g. Site A, Site B"></div>
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary">Save Supervisor</button></div>
  </form>`);
  document.getElementById("supervisorForm").addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.target);state.supervisors.push({id:uid("sup_"),name:f.get("name"),phone:f.get("phone"),sites:f.get("sites")});save();closeModal();showToast("Supervisor added.");
  });
}

function rowActions(type,id){return `<button class="delete-btn" data-delete="${type}" data-id="${id}">Delete</button>`;}
function renderMeasurements(){
  const q=(document.getElementById("measurementSearch")?.value||"").toLowerCase(),site=document.getElementById("measurementSiteFilter")?.value||"",date=document.getElementById("measurementDateFilter")?.value||"";
  const rows=state.measurements.filter(x=>(!q||`${x.site} ${x.work} ${x.supervisor}`.toLowerCase().includes(q))&&(!site||x.site===site)&&(!date||x.date===date));
  document.getElementById("measurementTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Date</th><th>Site</th><th>Work</th><th>Supervisor</th><th>Dimensions</th><th>Qty</th><th>Unit</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td><strong>${esc(x.site)}</strong></td><td>${esc(x.work)}</td><td>${esc(x.supervisor)}</td><td>${x.length} × ${x.breadth}${x.height?` × ${x.height}`:""}</td><td><strong>${Number(x.quantity).toFixed(2)}</strong></td><td><span class="pill">${esc(x.unit)}</span></td><td>${rowActions("measurements",x.id)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">No measurement records found.</div>`;
  document.getElementById("measurementSiteFilter").innerHTML=siteOptions("measurements",site);
}
function renderMaterials(){
  const q=(document.getElementById("materialSearch")?.value||"").toLowerCase(),site=document.getElementById("materialSiteFilter")?.value||"",date=document.getElementById("materialDateFilter")?.value||"";
  const rows=state.materials.filter(x=>(!q||`${x.item} ${x.supplier} ${x.site} ${x.supervisor}`.toLowerCase().includes(q))&&(!site||x.site===site)&&(!date||x.date===date));
  document.getElementById("materialTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Date</th><th>Site</th><th>Material</th><th>Supplier</th><th>Qty</th><th>Rate</th><th>Total</th><th>Buyer</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td><strong>${esc(x.site)}</strong></td><td>${esc(x.item)}</td><td>${esc(x.supplier)}</td><td>${x.qty} ${esc(x.unit)}</td><td>${money(x.rate)}</td><td><strong>${money(x.total)}</strong></td><td>${esc(x.buyer)}</td><td>${rowActions("materials",x.id)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">No material purchase records found.</div>`;
  document.getElementById("materialSiteFilter").innerHTML=siteOptions("materials",site);
}
function renderLabour(){
  const q=(document.getElementById("labourSearch")?.value||"").toLowerCase(),site=document.getElementById("labourSiteFilter")?.value||"",date=document.getElementById("labourDateFilter")?.value||"";
  const rows=state.labour.filter(x=>(!q||`${x.site} ${x.supervisor} ${x.category}`.toLowerCase().includes(q))&&(!site||x.site===site)&&(!date||x.date===date));
  document.getElementById("labourTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Date</th><th>Site</th><th>Supervisor</th><th>Category</th><th>Shift</th><th>Workers</th><th>Notes</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td><strong>${esc(x.site)}</strong></td><td>${esc(x.supervisor)}</td><td><span class="pill">${esc(x.category)}</span></td><td>${esc(x.shift)}</td><td><strong>${x.count}</strong></td><td>${esc(x.notes)}</td><td>${rowActions("labour",x.id)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">No labour entries found.</div>`;
  document.getElementById("labourSiteFilter").innerHTML=siteOptions("labour",site);
}
function renderSupervisors(){
  document.getElementById("supervisorGrid").innerHTML=state.supervisors.length?state.supervisors.map(s=>`<div class="supervisor-card"><div class="sup-left"><div class="avatar">${esc(s.name.charAt(0).toUpperCase())}</div><div><strong>${esc(s.name)}</strong><small>${esc(s.phone||"No phone")} · ${esc(s.sites||"No site assigned")}</small></div></div>${rowActions("supervisors",s.id)}</div>`).join(""):`<div class="empty">No supervisors added.</div>`;
}
function renderDashboard(){
  document.getElementById("statMeasurements").textContent=state.measurements.length;
  document.getElementById("statMaterials").textContent=state.materials.length;
  const labourToday=state.labour.filter(x=>x.date===todayISO()).reduce((a,x)=>a+x.count,0);
  document.getElementById("statLabour").textContent=labourToday;
  document.getElementById("statSupervisors").textContent=state.supervisors.length;
  document.getElementById("reportQuantity").textContent=state.measurements.reduce((a,x)=>a+(+x.quantity||0),0).toFixed(2);
  document.getElementById("reportSpend").textContent=money(state.materials.reduce((a,x)=>a+(+x.total||0),0));
  document.getElementById("reportWorkers").textContent=state.labour.reduce((a,x)=>a+x.count,0);
  const l=state.labour.slice(0,5),m=state.materials.slice(0,5);
  document.getElementById("recentLabour").innerHTML=l.length?`<table class="data-table"><thead><tr><th>Date</th><th>Site</th><th>Supervisor</th><th>Category</th><th>Count</th></tr></thead><tbody>${l.map(x=>`<tr><td>${x.date}</td><td>${esc(x.site)}</td><td>${esc(x.supervisor)}</td><td>${esc(x.category)}</td><td><strong>${x.count}</strong></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No entries yet.</div>`;
  document.getElementById("recentMaterials").innerHTML=m.length?`<table class="data-table"><thead><tr><th>Date</th><th>Material</th><th>Site</th><th>Total</th></tr></thead><tbody>${m.map(x=>`<tr><td>${x.date}</td><td>${esc(x.item)}</td><td>${esc(x.site)}</td><td><strong>${money(x.total)}</strong></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No purchases yet.</div>`;
}
function renderAll(){renderDashboard();renderMeasurements();renderMaterials();renderLabour();renderSupervisors();}
function csvDownload(filename, rows){
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}
function exportCSV(){
  const rows=[["TYPE","DATE","SITE","DESCRIPTION","SUPERVISOR","CATEGORY","LENGTH","BREADTH","HEIGHT","QUANTITY","UNIT","RATE","TOTAL","NOTES"]];
  state.measurements.forEach(x=>rows.push(["MEASUREMENT",x.date,x.site,x.work,x.supervisor,"",x.lemgth,x.breadth,x.height,x.quantity,x.unit,"","",x.notes]));
  state.materials.forEach(x=>rows.push(["MATERIAL",x.date,x.site,x.item,x.supervisor,"",x.qty,x.unit,x.rate,x.total,x.notes]));
  state.labour.forEach(x=>rows.push(["LABOUR",x.date,x.site,"",x.supervisor,x.category,x.count,"","","",x.notes]));
  csvDownload("apex-construction-report.csv",rows);showToast("CSV report exported.");
}
function backup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`apex-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);showToast("Backup downloaded.");
}

document.addEventListener("click",e=>{
  const nav=e.target.closest(".nav-item"); if(nav){navigate(nav.dataset.section);return;}
  const link=e.target.closest("[data-section-link]"); if(link){navigate(link.dataset.sectionLink);return;}
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(action==="measurement")measurementForm();
  if(action==="material")materialForm();
  if(action==="labour")labourForm();
  if(action==="supervisor")supervisorForm();
  if(action==="close-modal")closeModal();
  if(action==="quick-add")labourForm();
  if(action==="export-csv")exportCSV();
  if(action==="backup")backup();
  const del=e.target.closest("[data-delete]");
  if(del){
    const type=del.dataset.delete,id=del.dataset.id;
    if(confirm("Delete this record?")){state[type]=state[type].filter(x=>x.id!==id);save();showToast("Record deleted.");}
  }
});
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
document.getElementById("mobileMenu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
["measurementSearch","measurementSiteFilter","measurementDateFilter","materialSearch","materialSiteFilter","materialDateFilter","labourSearch","labourSiteFilter","labourDateFilter"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input",renderAll);
  document.getElementById(id)?.addEventListener("change",renderAll);
});
document.getElementById("today").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
renderAll();
