import {db,coverURL} from "./firebase-site.js";
import {collection,query,where,getDocs,doc,getDoc} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export async function initHome(root,url){
await Promise.all([
(async()=>{
    const section = root.querySelector(".featured-book");
    try {
      const snapshot = await getDocs(query(collection(db,"books"),where("published","==",true)));
      const books = snapshot.docs.filter(d=>typeof d.data().title==="string" && d.data().title.trim());
      const chosen = books.find(d=>d.data().featured===true) || books[0];
      if(chosen) {
        const book=chosen.data(), img=section.querySelector("img");
        const cover=coverURL(book.cover);
        if(cover) { img.src=cover; img.alt="Portada de "+book.title; } else { img.removeAttribute("src"); img.hidden=true; }
        section.querySelector("h2").textContent=book.title;
        section.querySelector("div > p:not(.author-kicker)").textContent=book.description||"";
        section.querySelector("a").href="/pages/libros.html?book="+encodeURIComponent(chosen.id);
        section.hidden=false;
        root.querySelector(".home-books").hidden=false;
        root.querySelector("#legacy-book-benefits").hidden=chosen.id!=="legacy-1";
        root.querySelector("#legacy-book-benefits").querySelector("h2").textContent=book.title;
      }
    } catch(e) { console.error("No se pudo cargar el libro destacado",e); }
  })(),
(async()=>{
    try {
      const snapshot = await getDoc(doc(db,"content","homepage"));
      if (snapshot.exists() && snapshot.data().published === true) {
        const data = snapshot.data();
        const selectors = {
          kicker:".author-intro .author-kicker",
          title:".author-intro h1",
          introduction:".author-intro div > p:not(.author-kicker)",
          button:".author-intro a",
          featuredLabel:".featured-book .author-kicker",
          featuredButton:".featured-book a",
          eventTitle:".events-cta h2",
          eventText:".events-cta p",
          eventButton:".events-cta a"
        };
        for (const [key,selector] of Object.entries(selectors)) {
          const el=root.querySelector(selector);
          if(el && typeof data[key]==="string" && data[key].trim()) el.textContent=(key==="eventButton"?"📅 ":"")+data[key];
        }
        const photo=coverURL(data.photo);
        if(photo) {
          const img=root.querySelector(".author-intro img");
          img.src=photo;
          if(typeof data.title==="string" && data.title.trim()) img.alt=data.title;
        }
      }
    } catch(e) { console.info("Se muestra el contenido original de inicio."); }
  })()
]);
}
