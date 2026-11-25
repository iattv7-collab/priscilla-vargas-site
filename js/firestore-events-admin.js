import {app,db,coverURL} from "./firebase-site.js";
import {youtubeId} from "./testimonial-video.js";
import {openWorkspace,closeWorkspace} from "./admin-workspace.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {collection,doc,query,where,getDocs,setDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js";
const auth=getAuth(app),storage=getStorage(app),col=collection(db,"content"),$=id=>document.getElementById(id);
const keys=["title","date","time","location","description","flyer","video"];
let generation=0,previewURL=null;
export function resetEvents(){
 generation++;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;
 $("event-form").reset();$("event-form").hidden=true;$("event-actions").hidden=false;$("event-list").replaceChildren();$("event-new").disabled=true;$("event-status").textContent="";$("event-preview").hidden=true;$("event-preview").removeAttribute("src");closeWorkspace("event");
}
export function initEvents(){
 const version=++generation,uid=auth.currentUser?.uid,active=()=>!!uid&&uid===auth.currentUser?.uid&&version===generation;
 const form=$("event-form"),status=$("event-status"),list=$("event-list"),picker=$("event-file"),preview=$("event-preview"),drop=$("event-drop");
 let selected=null,busy=false,pending=null,baseline=null;
 const values=()=>({...Object.fromEntries(keys.map(k=>[k,$("event-"+k).value.trim()])),published:$("event-published").checked,kind:"conference"});
 function setBusy(v){busy=v;for(const el of $("event-manager").querySelectorAll("button,input,textarea"))el.disabled=v;}
 function show(){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=pending?URL.createObjectURL(pending):null;const url=previewURL||coverURL($("event-flyer").value);preview.hidden=!url;if(url)preview.src=url;else preview.removeAttribute("src");}
 function choose(file){if(busy||!active()||!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||!file.size||file.size>5*1024*1024){pending=null;picker.value="";show();status.textContent="Imagen no válida. Máximo 5 MB.";return;}pending=file;show();status.textContent="Imagen seleccionada.";}
 picker.onchange=()=>choose(picker.files[0]);drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();picker.value="";choose(e.dataTransfer.files[0]);};$("event-flyer").oninput=()=>{pending=null;picker.value="";show();};
 function open(id,data={}){if(busy||!active()||!openWorkspace("event"))return;selected=id;form.reset();pending=null;for(const k of keys)$("event-"+k).value=data[k]||"";$("event-published").checked=data.published===true;baseline=JSON.stringify(values());$("event-editor-title").textContent=id?"Editar conferencia":"Nueva conferencia o video";$("event-delete").hidden=!id;$("event-actions").hidden=true;form.hidden=false;show();status.textContent="";$("event-title").focus();}
 function close(){selected=null;pending=null;baseline=null;form.reset();show();form.hidden=true;$("event-actions").hidden=false;closeWorkspace("event");$("event-new").focus();}
 async function refresh(){const snap=await getDocs(query(col,where("kind","==","conference")));if(!active())return;list.replaceChildren();const entries=snap.docs.sort((a,b)=>(b.data().date||"").localeCompare(a.data().date||""));for(const d of entries){const t=d.data(),button=document.createElement("button");button.type="button";button.textContent=(t.title||"Sin título")+(t.date?" · "+t.date:"")+" — "+(t.published?"Publicado":"Borrador");button.onclick=()=>open(d.id,t);list.append(button,document.createElement("br"));}if(!entries.length)list.textContent="No hay conferencias ni videos.";}
 async function action(fn,success){if(busy||!active())return;setBusy(true);status.textContent="Procesando…";try{await fn();if(active())status.textContent=success;}catch(e){console.error(e);if(active())status.textContent="No se pudo completar: "+e.message;}finally{if(active())setBusy(false);}}
 $("event-new").onclick=()=>open(null);
 $("event-cancel").onclick=()=>{if(busy||!active())return;if((pending||JSON.stringify(values())!==baseline)&&!confirm("¿Descartar los cambios sin guardar?"))return;close();status.textContent="";};
 form.onsubmit=e=>{e.preventDefault();if(busy||!active()||form.hidden)return;const data=values();
 if(!data.title||(!data.date&&!data.video)){status.textContent="Escribe un título y una fecha o un enlace de video.";return;}
 if(data.video&&!youtubeId(data.video)){status.textContent="Usa un enlace HTTPS válido de YouTube.";return;}
 if(data.flyer&&!pending&&!coverURL(data.flyer)){status.textContent="Imagen no válida.";return;}
 if(!confirm(data.published?"¿Guardar y publicar?":"¿Guardar como borrador?"))return;
 const target=selected?doc(col,selected):doc(col,"conference-"+crypto.randomUUID());
 action(async()=>{if(pending){const file=pending,ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type],object=ref(storage,"public/conferences/"+target.id+"/"+crypto.randomUUID()+"."+ext);status.textContent="Subiendo imagen…";await uploadBytes(object,file,{contentType:file.type,cacheControl:"public,max-age=86400"});data.flyer=await getDownloadURL(object);if(!active())return;$("event-flyer").value=data.flyer;pending=null;picker.value="";show();}if(!active())return;await setDoc(target,data,{merge:true});if(!active())return;close();await refresh();},"Conferencia guardada.");};
 $("event-delete").onclick=()=>{if(!selected||busy||!active()||!confirm("¿Eliminar permanentemente esta conferencia o video?"))return;const target=doc(col,selected);action(async()=>{await deleteDoc(target);if(!active())return;close();await refresh();},"Conferencia eliminada.");};
 action(refresh,"");
}
