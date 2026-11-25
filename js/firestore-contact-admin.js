import {app,db} from "./firebase-site.js";
import {contactFields,validEmail,socialURL,socialLabels} from "./contact-fields.js";
import {openWorkspace,closeWorkspace} from "./admin-workspace.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {doc,getDoc,setDoc} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
const auth=getAuth(app),target=doc(db,"content","contact"),$=id=>document.getElementById(id);
let generation=0;
export function resetContact(){generation++;$("contact-form").reset();$("contact-form").hidden=true;$("contact-edit").hidden=false;$("contact-status").textContent="";closeWorkspace("contact");}
export function initContact(){
 $("contact-edit").onclick=async()=>{
  if(!openWorkspace("contact"))return;
  const version=++generation,uid=auth.currentUser?.uid,active=()=>!!uid&&uid===auth.currentUser?.uid&&generation===version;
  const form=$("contact-form"),status=$("contact-status");form.hidden=false;$("contact-edit").hidden=true;
  let busy=false,baseline="";
  const values=()=>Object.fromEntries(contactFields.map(([k])=>[k,$("contact-"+k).value.trim()]));
  const setBusy=v=>{busy=v;for(const el of form.querySelectorAll("input,textarea,button"))el.disabled=v;};
  const close=()=>{resetContact();$("contact-edit").focus();};
  $("contact-cancel").onclick=()=>{if(busy||!active())return;if(JSON.stringify(values())!==baseline&&!confirm("¿Descartar los cambios sin guardar?"))return;close();};
  setBusy(true);status.textContent="Cargando…";
  try{const snap=await getDoc(target);if(!active())return;const data=snap.exists()?snap.data():{};for(const [k,label,def] of contactFields)$("contact-"+k).value=typeof data[k]==="string"?data[k]:def;baseline=JSON.stringify(values());setBusy(false);status.textContent="Contenido listo para editar.";}
  catch(e){if(active()){close();status.textContent="No se pudo cargar. Intenta nuevamente.";}return;}
  form.onsubmit=async e=>{e.preventDefault();if(busy||!active())return;const data=values();
   if(!validEmail(data.email)||!data.heading||!data.subtitle||!data.socialText){status.textContent="Completa los campos obligatorios y verifica el correo.";return;}
   for(const key of Object.keys(socialLabels)){if(data[key]&&!socialURL(key,data[key])){status.textContent="Enlace no válido: "+socialLabels[key];return;}}
   if(!confirm("¿Publicar los cambios de contacto y redes sociales?"))return;
   setBusy(true);status.textContent="Guardando…";
   try{await setDoc(target,{...data,published:true},{merge:true});if(active()){close();status.textContent="Contacto guardado y publicado.";}}
   catch(e){if(active())status.textContent="No se pudo guardar: "+e.message;}
   finally{if(active())setBusy(false);}
  };
 };
}
