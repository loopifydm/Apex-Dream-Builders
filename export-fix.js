// APEX CSV export fix v1 - preserves measurement dimensions
(function(){
  function csvCell(value){
    const s=String(value ?? "");
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function downloadCSV(filename, rows){
    const csv=rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener("click",function(e){
    const button=e.target.closest('[data-action="export-csv"]');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      const data=typeof state!=="undefined"&&state?state:{measurements:[],materials:[],labour:[]};
      const rows=[
        ["APEX Dream Builders & Engineers"],
        ["Measurements"],
        ["Date","Site","Work","Supervisor","Length","Breadth","Height / Depth","Calculation","Quantity","Unit","Notes"]
      ];
      (data.measurements||[]).forEach(x=>rows.push([
        x.date,x.site,x.work,x.supervisor,x.length,x.breadth,x.height,x.formula,x.quantity,x.unit,x.notes
      ]));
      rows.push([],["Material Buying"],["Date","Site","Material","Supplier","Invoice","Quantity","Unit","Rate","Total","Buyer","Supervisor","Notes"]);
      (data.materials||[]).forEach(x=>rows.push([
        x.date,x.site,x.item,x.supplier,x.invoice,x.qty,x.unit,x.rate,x.total,x.buyer,x.supervisor,x.notes
      ]));
      rows.push([],["Daily Labour"],["Date","Site","Supervisor","Shift","Category","Worker Count","Notes"]);
      (data.labour||[]).forEach(x=>rows.push([
        x.date,x.site,x.supervisor,x.shift,x.category,x.count,x.notes
      ]));
      downloadCSV("APEX-Dream-Builders-Report.csv",rows);
      if(typeof showToast==="function")showToast("CSV exported with Length, Breadth and Height.");
    }catch(err){
      console.error("CSV export failed",err);
      if(typeof showToast==="function")showToast("CSV export failed. Please try again.");
    }
  },true);
})();
