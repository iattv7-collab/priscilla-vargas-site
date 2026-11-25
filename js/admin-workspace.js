// One active editor at a time. Dashboard actions are inaccessible during editing.
let workspace = null;
export function openWorkspace(name) {
 if (workspace !== null) return false;
 workspace=name;
 document.querySelectorAll("[data-admin-section]").forEach(el=>{el.hidden=el.dataset.adminSection!==name;});
 document.querySelectorAll("[data-dashboard-only]").forEach(el=>{el.hidden=true;});
 const back=document.getElementById("workspace-back");
 back.hidden=false;
 back.onclick=()=>{
  const cancel=document.getElementById(name==="books"?"book-cancel":name==="home"?"home-cancel":name+"-cancel");
  if(cancel && !cancel.disabled) cancel.click();
 };
 window.scrollTo(0,0);
 return true;
}
export function closeWorkspace(name) {
 if(workspace!==name)return;
 resetWorkspace();
}
export function resetWorkspace() {
 workspace=null;
 const back=document.getElementById("workspace-back");
 back.hidden=true; back.onclick=null;
 document.querySelectorAll("[data-admin-section],[data-dashboard-only]").forEach(el=>{el.hidden=false;});
}
window.addEventListener("beforeunload",e=>{if(workspace!==null){e.preventDefault();e.returnValue="";}});
