// APEX Dream Builders — Vendor Payments module
// Supervisors can submit vendor payments. Only Admin can view the payment list and report.
(function(){
  const VENDOR_KEY = "apexVendorPaymentsV1";

  function getPayments(){
    try { return JSON.parse(localStorage.getItem(VENDOR_KEY) || "[]"); }
    catch(e){ return []; }
  }

  function savePayments(rows){
    localStorage.setItem(VENDOR_KEY, JSON.stringify(rows));
  }

  function injectUI(){
    const nav = document.querySelector('.nav');
    const reportsNav = document.querySelector('.nav-item[data-section="reports"]');
    if(nav && !document.querySelector('.nav-item[data-section="vendorPayments"]')){
      const btn=document.createElement('button');
      btn.className='nav-item';
      btn.dataset.section='vendorPayments';
      btn.innerHTML='₹ <span>Vendor Payments</span>';
      if(reportsNav) nav.insertBefore(btn,reportsNav); else nav.appendChild(btn);
    }

    const content=document.querySelector('.content');
    const reports=document.getElementById('reports');
    if(content && !document.getElementById('vendorPayments')){
      const section=document.createElement('section');
      section.id='vendorPayments';
      section.className='section';
      section.innerHTML=`
        <div class="section-head">
          <div><h2>Vendor Payments</h2><p>Record vendor payments from the site and keep payment reporting under Admin control.</p></div>
          <button class="btn btn-primary" data-action="vendor-payment">+ Add Vendor Payment</button>
        </div>
        <div id="vendorSupervisorNotice" class="panel" hidden>
          <div class="panel-head"><div><h3>Payment submission</h3><p>Your payment entries are submitted to Admin. The payment list and report are not visible to Supervisors.</p></div></div>
        </div>
        <div id="vendorAdminView" hidden>
          <div class="report-grid" id="vendorReportCards"></div>
          <div class="panel">
            <div class="panel-head"><div><h3>Vendor Payment List</h3><p>Admin-only payment records.</p></div></div>
            <div class="filters"><input id="vendorPaymentSearch" placeholder="Search vendor or supervisor..."><input type="date" id="vendorPaymentDateFilter"></div>
            <div id="vendorPaymentTable" class="table-wrap"></div>
          </div>
        </div>
      `;
      if(reports) content.insertBefore(section,reports); else content.appendChild(section);
    }
  }

  function openVendorPaymentForm(){
    const supervisor = window.currentUser?.name || '';
    if(typeof openModal !== 'function') return;
    openModal('Add Vendor Payment',`<form class="form" id="vendorPaymentForm">
      <div class="form-grid">
        <div class="field full"><label>Vendor Name</label><input name="vendor" required placeholder="Enter vendor name"></div>
        <div class="field"><label>Amount (₹)</label><input name="amount" type="number" min="0" step="0.01" required placeholder="0.00"></div>
        <div class="field"><label>Date</label><input name="date" type="date" value="${typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}" required></div>
        <div class="field full"><label>Supervisor Name</label><input name="supervisor" value="${esc(supervisor)}" readonly></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary">Save Vendor Payment</button></div>
    </form>`);

    document.getElementById('vendorPaymentForm').addEventListener('submit',function(e){
      e.preventDefault();
      if(window.currentUser?.role !== 'supervisor' && window.currentUser?.role !== 'admin'){
        showToast('Please login to add a payment.'); return;
      }
      const f=new FormData(e.target);
      const rows=getPayments();
      rows.unshift({
        id: typeof uid==='function' ? uid('vp_') : 'vp_'+Date.now(),
        vendor:String(f.get('vendor')||'').trim(),
        amount:Number(f.get('amount')||0),
        supervisor: window.currentUser?.role==='supervisor' ? window.currentUser.name : String(f.get('supervisor')||'').trim(),
        date:f.get('date')
      });
      savePayments(rows);
      if(typeof closeModal==='function') closeModal();
      showToast('Vendor payment submitted successfully.');
      renderVendorPayments();
    });
  }

  function renderVendorPayments(){
    const adminView=document.getElementById('vendorAdminView');
    const notice=document.getElementById('vendorSupervisorNotice');
    if(!adminView) return;
    const isAdmin=window.currentUser?.role==='admin';
    adminView.hidden=!isAdmin;
    if(notice) notice.hidden=isAdmin;

    if(!isAdmin) return;
    const search=(document.getElementById('vendorPaymentSearch')?.value||'').toLowerCase();
    const date=document.getElementById('vendorPaymentDateFilter')?.value||'';
    const rows=getPayments().filter(x=>(!search||`${x.vendor} ${x.supervisor}`.toLowerCase().includes(search))&&(!date||x.date===date));
    const all=getPayments();
    const total=all.reduce((sum,x)=>sum+Number(x.amount||0),0);
    const today=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
    const todayTotal=all.filter(x=>x.date===today).reduce((sum,x)=>sum+Number(x.amount||0),0);
    document.getElementById('vendorReportCards').innerHTML=`
      <div class="report-card"><span>Total Vendor Payments</span><strong>${all.length}</strong><small>All payment entries</small></div>
      <div class="report-card"><span>Total Paid to Vendors</span><strong>${money(total)}</strong><small>All recorded payments</small></div>
      <div class="report-card"><span>Today's Payments</span><strong>${money(todayTotal)}</strong><small>Payments dated today</small></div>`;
    document.getElementById('vendorPaymentTable').innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Vendor Name</th><th>Amount</th><th>Supervisor Name</th><th>Date</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.vendor)}</strong></td><td><strong>${money(x.amount)}</strong></td><td>${esc(x.supervisor)}</td><td>${esc(x.date)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">No vendor payment records found.</div>`;
  }

  function bind(){
    injectUI();
    document.addEventListener('click',function(e){
      const nav=e.target.closest('.nav-item[data-section="vendorPayments"]');
      if(nav){
        e.preventDefault();
        if(typeof navigate==='function') navigate('vendorPayments');
        renderVendorPayments();
        return;
      }
      const action=e.target.closest('[data-action="vendor-payment"]');
      if(action){e.preventDefault();openVendorPaymentForm();}
    });
    document.addEventListener('input',function(e){if(e.target.id==='vendorPaymentSearch')renderVendorPayments();});
    document.addEventListener('change',function(e){if(e.target.id==='vendorPaymentDateFilter')renderVendorPayments();});
    renderVendorPayments();
  }

  window.renderVendorPayments=renderVendorPayments;
  window.addEventListener('DOMContentLoaded',bind);
})();
