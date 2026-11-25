import {db} from "./firebase-site.js";
import {youtubeId} from "./testimonial-video.js";
import {collection,query,where,getDocs} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export async function initTestimonials(root){
const grid=root.querySelector(".testimonial-grid");
try{
 const snap=await getDocs(query(collection(db,"testimonials"),where("published","==",true)));
 for(const d of snap.docs){
  const t=d.data(),id=youtubeId(t.video),quote=typeof t.quote==="string"?t.quote.trim():"",name=typeof t.author==="string"?t.author.trim():"";
  if(!name||(!quote&&!id))continue;
  const card=document.createElement("article");card.className="testimonial";
  if(quote){const p=document.createElement("p");p.className="quote";p.textContent=quote;card.append(p);}
  if(id){
   const video=document.createElement("iframe");video.src="https://www.youtube-nocookie.com/embed/"+id;video.title="Testimonio de "+name;video.loading="lazy";video.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";video.allowFullscreen=true;video.referrerPolicy="strict-origin-when-cross-origin";video.style.cssText="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;margin:0 0 14px";
   const link=document.createElement("a");link.href="https://www.youtube.com/watch?v="+id;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Ver en YouTube";link.style.display="block";card.append(video,link);
  }
  const author=document.createElement("p");author.className="author-name";author.textContent=name;card.append(author);grid.append(card);
 }
 grid.closest("section").hidden=!grid.childElementCount;
}catch(e){console.error("No se pudieron cargar los testimonios",e);}

}
