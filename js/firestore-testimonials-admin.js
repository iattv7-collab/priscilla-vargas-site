import {app,db} from "./firebase-site.js";
import {youtubeId} from "./testimonial-video.js";
import {openWorkspace,closeWorkspace} from "./admin-workspace.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {collection,doc,getDocs,setDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
const auth=getAuth(app),col=collection(db,"testimonials"),$=id=>document.getElementById(id);
let generation=0;
export function resetTestimonials(){
 generation++;$("test-form").reset();$("test-form").hidden=true;$("test-actions").hidden=false;$("test-list").replaceChildren();$("test-status").textContent="";$("test-import").hidden=true;$("test-new").disabled=true;closeWorkspace("test");
}
export function initTestimonials(){
 const version=++generation,uid=auth.currentUser?.uid,active=()=>!!uid&&auth.currentUser?.uid===uid&&version===generation;
 const form=$("test-form"),list=$("test-list"),status=$("test-status");
 let selected=null,busy=false,baseline=null;
 const values=()=>({author:$("test-author").value.trim(),quote:$("test-quote").value.trim(),video:$("test-video").value.trim(),published:$("test-published").checked});
 function setBusy(value){busy=value;for(const el of $("test-manager").querySelectorAll("button,input,textarea"))el.disabled=value;}
 function open(id,data={}){
  if(busy||!active()||!openWorkspace("test"))return;
  selected=id;form.reset();
  for(const key of ["author","quote","video"])$("test-"+key).value=data[key]||"";
  $("test-published").checked=data.published===true;
  baseline=JSON.stringify(values());$("test-editor-title").textContent=id?"Editar testimonio":"Nuevo testimonio";
  $("test-delete").hidden=!id;$("test-actions").hidden=true;form.hidden=false;status.textContent="";$("test-author").focus();
 }
 function close(){selected=null;baseline=null;form.reset();form.hidden=true;$("test-actions").hidden=false;closeWorkspace("test");$("test-new").focus();}
 async function refresh(){
  const snap=await getDocs(col);if(!active())return;
  list.replaceChildren();$("test-import").hidden=true;
  for(const d of snap.docs){
   const t=d.data(),button=document.createElement("button");button.type="button";button.textContent=(t.author||"Sin nombre")+" — "+(t.published?"Publicado":"Borrador");button.onclick=()=>open(d.id,t);list.append(button,document.createElement("br"));
  }
  if(snap.empty)list.textContent="No hay testimonios.";
 }
 async function action(fn,success){
  if(busy||!active())return;setBusy(true);status.textContent="Procesando…";
  try{await fn();if(active())status.textContent=success;}
  catch(e){console.error(e);if(active())status.textContent="No se pudo completar: "+e.message;}
  finally{if(active())setBusy(false);}
 }
 $("test-new").onclick=()=>open(null);
 $("test-cancel").onclick=()=>{if(busy||!active())return;if(JSON.stringify(values())!==baseline&&!confirm("¿Descartar los cambios sin guardar?"))return;close();status.textContent="";};
 form.onsubmit=e=>{
  e.preventDefault();if(busy||!active()||form.hidden)return;
  const data=values();
  if(!data.author||(!data.quote&&!data.video)){status.textContent="Escribe el nombre y un testimonio o enlace de video.";return;}
  if(data.video&&!youtubeId(data.video)){status.textContent="Usa un enlace HTTPS válido de YouTube.";return;}
  if(!confirm(data.published?"¿Guardar y publicar este testimonio?":"¿Guardar como borrador (no visible en el sitio)?"))return;
  const target=selected?doc(col,selected):doc(col);
  action(async()=>{await setDoc(target,data,{merge:true});if(!active())return;close();await refresh();},"Testimonio guardado.");
 };
 $("test-delete").onclick=()=>{if(!selected||busy||!active()||!confirm("¿Eliminar permanentemente este testimonio?"))return;const target=doc(col,selected);action(async()=>{await deleteDoc(target);if(!active())return;close();await refresh();},"Testimonio eliminado.");};

 action(refresh,"");
}
