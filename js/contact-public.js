import {db} from "./firebase-site.js";
import {contactFields,validEmail,socialURL,socialLabels} from "./contact-fields.js";
import {doc,getDoc} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
const defaults=Object.fromEntries(contactFields.map(([k,l,v])=>[k,v]));
let data={...defaults};
try{const snap=await getDoc(doc(db,"content","contact"));if(snap.exists()&&snap.data().published===true){for(const [k] of contactFields)if(typeof snap.data()[k]==="string")data[k]=snap.data()[k];}}catch(e){console.info("Se muestran los datos originales de contacto.");}
const email=validEmail(data.email)?data.email:defaults.email;
for(const el of document.querySelectorAll("[data-contact-email]")){el.textContent=email;el.href="mailto:"+email;}
for(const el of document.querySelectorAll("[data-contact-text]")){const key=el.dataset.contactText;el.textContent=data[key]||defaults[key]||"";}
for(const el of document.querySelectorAll("[data-social-links]")){
 for(const [key,label] of Object.entries(socialLabels)){const url=socialURL(key,data[key]);if(!url)continue;const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;a.style.cssText="display:inline-block;color:inherit;margin:6px 10px;text-decoration:underline";el.append(a);}
 el.hidden=!el.childElementCount;
}
const form=document.getElementById("contact-message-form");
if(form){
 const button=form.querySelector("button[type=submit]");button.disabled=false;
 form.addEventListener("submit",e=>{e.preventDefault();const values=new FormData(form);const subject=String(values.get("asunto")||"Contacto");const body="Nombre: "+values.get("nombre")+"\nCorreo: "+values.get("email")+"\n\n"+values.get("mensaje");
 document.getElementById("contact-message-status").textContent="Se abrirá tu aplicación de correo. Debes enviar el mensaje desde allí.";
 location.href="mailto:"+email+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
 });
}
