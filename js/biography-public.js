import { db, coverURL } from "./firebase-site.js";
import { biographyFields } from "./biography-fields.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
try {
 const snap=await getDoc(doc(db,"content","biography"));
 if(snap.exists() && snap.data().published===true){
  const data=snap.data();
  for(const field of biographyFields){
   const value=data[field.key];
   if(typeof value!=="string"||!value.trim()||value===field.value)continue;
   if(field.key==="photo"){
    const url=coverURL(value);if(url)document.querySelector("[data-bio-photo]").src=url;
   }else{
    const el=document.querySelector('[data-bio-field="'+field.key+'"]');
    if(el){if(el.children.length===1&&el.firstElementChild.tagName==="STRONG")el.firstElementChild.textContent=value;else{el.textContent=value;el.style.whiteSpace="pre-line";}}
   }
  }
 }
}catch(e){console.info("Se muestra la biografía original.");}
