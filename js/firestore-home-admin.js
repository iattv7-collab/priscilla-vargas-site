import { app, db, coverURL } from "./firebase-site.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js";
const defaults = {
 kicker:"Autora · Conferencista · Mentora",
 title:"Apostle Priscilla Vargas",
 introduction:"Con más de 20 años de trayectoria ministerial, dedicada a llevar el mensaje transformador de Jesucristo, ministrando sanidad interior, liberación y restauración por el poder del Espíritu Santo y fundamentada en la Palabra de Dios.",
 photo:"images/author-hires.jpg",
 button:"Conoce a Priscilla",
 featuredLabel:"Libro destacado",
 featuredButton:"Descubre sus libros",
 eventTitle:"Invita a Apostle Priscilla Vargas a tu iglesia o evento",
 eventText:"Conferencias, presentaciones del libro y mensajes de inspiración sobre la gratitud, la fe y el propósito de Dios.",
 eventButton:"Solicitar Información"
};
const fields = Object.keys(defaults);
const contentRef = doc(db,"content","homepage");
const auth = getAuth(app);
const storage = getStorage(app);
let generation=0;
export async function initHomepage() {
 const version=++generation, uid=auth.currentUser?.uid;
 const $=id=>document.getElementById(id), form=$("home-form"), status=$("home-status"), preview=$("home-preview"), picker=$("home-file"), drop=$("home-drop");
 const active=()=>generation===version && auth.currentUser?.uid===uid;
 let pending=null, objectURL=null, busy=false;
 function setBusy(value) { busy=value; for(const el of form.querySelectorAll("input,textarea,button")) el.disabled=value; }
 function renderPreview() {
  if(objectURL) URL.revokeObjectURL(objectURL);
  objectURL=pending?URL.createObjectURL(pending):null;
  const url=objectURL||coverURL($("home-photo").value.trim());
  preview.hidden=!url;
  if(url) preview.src=url; else preview.removeAttribute("src");
 }
 function choose(file) {
  if(!file||busy||!active())return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size===0||file.size>5*1024*1024) {
   pending=null;picker.value="";renderPreview();status.textContent="Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB.";return;
  }
  pending=file;renderPreview();status.textContent="Imagen seleccionada. Se subirá al guardar.";
 }
 picker.onchange=()=>choose(picker.files[0]);
 drop.ondragover=e=>e.preventDefault();
 drop.ondrop=e=>{e.preventDefault();picker.value="";choose(e.dataTransfer.files[0]);};
 $("home-photo").oninput=()=>{pending=null;picker.value="";renderPreview();};
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||!active())return;
  setBusy(true);status.textContent="Guardando…";
  try {
   const data=Object.fromEntries(fields.map(k=>[k,$("home-"+k).value.trim()]));
   if(fields.some(k=>!data[k]))throw Error("Completa todos los campos.");
   if(!pending&&!coverURL(data.photo))throw Error("La imagen no es válida.");
   if(pending){
    const file=pending,ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
    const object=ref(storage,"public/homepage/"+crypto.randomUUID()+"."+ext);
    status.textContent="Subiendo fotografía…";
    await uploadBytes(object,file,{contentType:file.type,cacheControl:"public,max-age=86400"});
    data.photo=await getDownloadURL(object);
    if(!active())return;
    $("home-photo").value=data.photo;pending=null;picker.value="";renderPreview();
   }
   if(!active())return;
   await setDoc(contentRef,{...data,published:true},{merge:true});
   if(active())status.textContent="Inicio guardado y publicado correctamente.";
  }catch(e){console.error(e);if(active())status.textContent="No se pudo guardar: "+e.message;}
  finally{if(active())setBusy(false);}
 };
 setBusy(true);status.textContent="Cargando contenido…";
 try{
  const snap=await getDoc(contentRef);if(!active())return;
  const data={...defaults,...(snap.exists()?snap.data():{})};
  for(const k of fields)$("home-"+k).value=typeof data[k]==="string"?data[k]:defaults[k];
  renderPreview();status.textContent=snap.exists()?"Contenido cargado.":"Contenido actual listo para editar.";
  setBusy(false);
 }catch(e){console.error(e);if(active())status.textContent="No se pudo cargar. Recarga la página para intentar nuevamente.";}
}
export function resetHomepage() {
 generation++;
 const form=document.getElementById("home-form");
 form.reset();const preview=document.getElementById("home-preview");if(preview.src.startsWith("blob:"))URL.revokeObjectURL(preview.src);
 preview.hidden=true;preview.removeAttribute("src");document.getElementById("home-status").textContent="";
}
