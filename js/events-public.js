import {db,coverURL} from "./firebase-site.js";
import {youtubeId} from "./testimonial-video.js";
import {collection,query,where,getDocs} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export async function initEvents(root){
const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
const dateKey=["year","month","day"].map(k=>today.find(p=>p.type===k).value).join("-");
const upcoming=root.querySelector("#upcoming-events"),past=root.querySelector("#past-events");
function card(t){
 const article=document.createElement("article");article.className="conference-card";
 const append=(tag,value)=>{if(!value)return;const el=document.createElement(tag);el.textContent=value;article.append(el);};
 const photo=coverURL(t.flyer);if(photo){const img=document.createElement("img");img.src=photo;img.alt="Anuncio de "+t.title;img.loading="lazy";article.append(img);}
 append("h3",t.title);
 if(/^\d{4}-\d{2}-\d{2}$/.test(t.date||"")){const day=new Date(t.date+"T12:00:00");if(!isNaN(day))append("p",new Intl.DateTimeFormat("es",{dateStyle:"long"}).format(day)+(t.time?" · "+t.time:""));}
 append("p",t.location);append("p",t.description);
 const id=youtubeId(t.video);if(id){const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+id;frame.title=t.title;frame.loading="lazy";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";frame.allow="encrypted-media; picture-in-picture; fullscreen";article.append(frame);const a=document.createElement("a");a.href="https://www.youtube.com/watch?v="+id;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Ver en YouTube";article.append(a);}
 return article;
}
try{
 const snap=await getDocs(query(collection(db,"content"),where("published","==",true)));
 const entries=snap.docs.map(d=>d.data()).filter(t=>t.kind==="conference"&&typeof t.title==="string"&&t.title.trim());
 const next=entries.filter(t=>t.date&&t.date>=dateKey).sort((a,b)=>a.date.localeCompare(b.date));
 const previous=entries.filter(t=>!t.date||t.date<dateKey).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 for(const [section,items] of [[upcoming,next],[past,previous]]){const grid=section.querySelector(".conference-grid");for(const t of items)grid.append(card(t));section.hidden=!items.length;}
}catch(e){console.error("No se pudieron cargar las conferencias",e);}

}
