import { app,db,coverURL } from "./firebase-site.js";
import { biographyFields } from "./biography-fields.js";
import { openWorkspace,closeWorkspace } from "./admin-workspace.js";
import { doc,getDoc,setDoc } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getStorage,ref,uploadBytes,getDownloadURL } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js";
const auth=getAuth(app),storage=getStorage(app),documentRef=doc(db,"content","biography");
const $=id=>document.getElementById(id);
let generation=0, previewUrl=null;
export function resetBiography(){
 generation++;
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
 $("bio-form").hidden=true;$("bio-fields").replaceChildren();$("bio-edit").hidden=false;$("bio-edit").setAttribute("aria-expanded","false");$("bio-status").textContent="";
 closeWorkspace("bio");
}
export function initBiography(){
 $("bio-edit").onclick=async()=>{
  if(!openWorkspace("bio"))return;
  const version=++generation,uid=auth.currentUser?.uid,active=()=>!!uid&&uid===auth.currentUser?.uid&&version===generation;
  const form=$("bio-form"),status=$("bio-status"),container=$("bio-fields");
  $("bio-edit").hidden=true;$("bio-edit").setAttribute("aria-expanded","true");form.hidden=false;container.replaceChildren();
  let busy=true,pending=null,baseline={},inputs={},preview,picker;
  const setBusy=v=>{busy=v;for(const el of form.querySelectorAll("input,textarea,button"))el.disabled=v;};
  const close=()=>{resetBiography();$("bio-edit").focus();};
  $("bio-cancel").onclick=()=>{if(busy||!active())return;if((pending||Object.keys(inputs).some(k=>inputs[k].value!==baseline[k]))&&!confirm("¿Descartar los cambios sin guardar?"))return;close();};
  setBusy(true);status.textContent="Cargando biografía…";
  try{
   const snap=await getDoc(documentRef);if(!active())return;
   const data=snap.exists()?snap.data():{};
   for(const field of biographyFields){
    const label=document.createElement("label"),input=document.createElement(field.value.length>100?"textarea":"input");
    input.id="bio-"+field.key;label.htmlFor=input.id;label.textContent=field.label;
    input.value=typeof data[field.key]==="string"?data[field.key]:field.value;input.required=true;
    if(input.tagName==="TEXTAREA")input.rows=Math.max(3,Math.ceil(input.value.length/95));
    inputs[field.key]=input;baseline[field.key]=input.value;container.append(label,input);
    if(field.key==="photo"){
     preview=document.createElement("img");preview.alt="Vista previa";preview.style.cssText="display:block;max-width:100%;max-height:240px;margin:12px auto;object-fit:contain";
     picker=document.createElement("input");picker.type="file";picker.accept="image/jpeg,image/png,image/webp";picker.setAttribute("aria-label","Seleccionar fotografía");
     const drop=document.createElement("div");drop.style.cssText="border:2px dashed #c9a227;padding:16px;border-radius:8px;margin-bottom:16px";
     const hint=document.createElement("small");hint.textContent="Seleccionar o arrastrar fotografía · JPEG, PNG o WebP · máximo 5 MB · pública al guardar";
     drop.append(preview,picker,hint);container.append(drop);
     const show=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=pending?URL.createObjectURL(pending):null;const url=previewUrl||coverURL(input.value.trim());preview.hidden=!url;if(url)preview.src=url;else preview.removeAttribute("src");};
     const choose=file=>{if(busy||!active()||!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||!file.size||file.size>5*1024*1024){pending=null;picker.value="";show();status.textContent="Imagen no válida. Máximo 5 MB.";return;}pending=file;show();status.textContent="Fotografía seleccionada.";};
     picker.onchange=()=>choose(picker.files[0]);drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();picker.value="";choose(e.dataTransfer.files[0]);};input.oninput=()=>{pending=null;picker.value="";show();};show();
    }
   }
   setBusy(false);status.textContent="Biografía lista para editar.";
  }catch(e){if(active()){close();status.textContent="No se pudo cargar la biografía. Intenta nuevamente."; }return;}
  form.onsubmit=async e=>{
   e.preventDefault();if(busy||!active()||!confirm("¿Publicar los cambios de la biografía?"))return;
   setBusy(true);status.textContent="Guardando…";
   try{
    const data=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value.trim()]));
    if(Object.values(data).some(v=>!v))throw Error("Completa todos los campos.");
    if(!pending&&!coverURL(data.photo))throw Error("Fotografía no válida.");
    if(pending){
     const file=pending,ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
     const object=ref(storage,"public/biography/"+crypto.randomUUID()+"."+ext);
     await uploadBytes(object,file,{contentType:file.type,cacheControl:"public,max-age=86400"});
     data.photo=await getDownloadURL(object);if(!active())return;
     inputs.photo.value=data.photo;pending=null;picker.value="";
    }
    if(!active())return;
    await setDoc(documentRef,{...data,published:true},{merge:true});
    if(active()){close();status.textContent="Biografía guardada y publicada correctamente.";}
   }catch(e){if(active())status.textContent="No se pudo guardar: "+e.message;}
   finally{if(active())setBusy(false);}
  };
 };
}
