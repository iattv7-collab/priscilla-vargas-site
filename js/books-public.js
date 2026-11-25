    import { db, amazonURL, coverURL } from "./firebase-site.js";
    import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export async function initBooks(root,url){

    const list = root.querySelector("#books-list"), detail = root.querySelector("#book-detail");
    let allBooks = [];
    const requested = new URLSearchParams(url.search).get("book");
    function showBook(book, item) {
      detail.replaceChildren();
      list.querySelectorAll(".book-item").forEach(el=>el.classList.remove("active"));
      item.classList.add("active");
      const cover = coverURL(book.cover);
      if (cover) { const img = document.createElement("img"); img.src=cover; img.alt=book.title; detail.append(img); }
      for (const [tag,value] of [["h2",book.title],["p",book.author],["p",book.description]]) {
        if (!value) continue;
        const el=document.createElement(tag); el.textContent=value; detail.append(el);
      }
      const url=amazonURL(book.amazonUrl);
      if(url) { const a=document.createElement("a"); a.href=url; a.className="btn-primary"; a.style.marginTop="20px"; a.textContent="Comprar en Amazon"; a.target="_blank"; a.rel="noopener noreferrer"; detail.append(a); }
    }
    function render() {
      const q=root.querySelector("#search").value.toLowerCase();
      const books=allBooks.filter(b=>[b.title,b.author].some(v=>String(v||"").toLowerCase().includes(q)));
      list.replaceChildren(); detail.textContent="No hay libros disponibles.";
      books.forEach((book,i)=>{
        const item=document.createElement("button"); item.type="button"; item.className="book-item"; item.style.cssText="display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eee;background-color:transparent;font:inherit;";
        const h=document.createElement("h4"); h.textContent=book.title;
        const p=document.createElement("p"); p.textContent=book.author||"";
        item.append(h,p); item.onclick=()=>showBook(book,item); list.append(item);
        if(i===0 || book.id===requested)showBook(book,item);
      });
    }
    root.querySelector("#search").addEventListener("input",render);
    detail.textContent="Cargando libros…";
    try {
      const snap=await getDocs(query(collection(db,"books"),where("published","==",true)));
      allBooks=snap.docs.map(d=>({...d.data(),id:d.id})).filter(b=>typeof b.title==="string" && b.title.trim());
      render();
    } catch(e) { console.error(e); detail.textContent="No se pudo cargar el catálogo. Intenta nuevamente."; }
  
}
