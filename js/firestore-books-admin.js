import { db, amazonURL, coverURL } from "./firebase-site.js";
import { collection, doc, getDocs, setDoc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export function initBooks() {
 const $ = id => document.getElementById(id);
 const form = $("book-form"), list = $("book-list"), status = $("book-status");
 let selected = null, busy = false;
 const fields = ["title","author","description","cover","price","amazonUrl"];
 function reset() { selected = null; form.reset(); $("book-author").value = "Apostle Priscilla Vargas"; $("book-delete").hidden = true; }
 function setBusy(value) { busy = value; for (const el of $("book-manager").querySelectorAll("button,input,textarea")) el.disabled = value; }
 async function refresh() {
  const snap = await getDocs(collection(db,"books"));
  list.replaceChildren();
  $("book-import").hidden = !snap.empty;
  for (const d of snap.docs) {
   const b = d.data(), button = document.createElement("button");
   button.type = "button"; button.textContent = b.title + (b.published ? " — Publicado" : " — Borrador");
   button.addEventListener("click", () => {
    selected = d.id;
    for (const key of fields) $("book-"+key).value = b[key] ?? "";
    $("book-published").checked = b.published === true;
    $("book-delete").hidden = false;
   });
   list.append(button, document.createElement("br"));
  }
  if (snap.empty) list.textContent = "No hay libros. Puedes importar el libro existente.";
 }
 async function action(fn) {
  if (busy) return;
  setBusy(true); status.textContent = "Procesando…";
  try { await fn(); status.textContent = "Guardado correctamente."; }
  catch(e) { console.error(e); status.textContent = "No se pudo completar la operación. " + (e.message || ""); }
  finally { setBusy(false); }
 }
 $("book-new").onclick = reset;
 form.onsubmit = e => {
  e.preventDefault();
  action(async () => {
   const data = Object.fromEntries(fields.map(k => [k,$("book-"+k).value.trim()]));
   if (!data.title) throw Error("El título es obligatorio.");
   if (data.cover && !coverURL(data.cover)) throw Error("URL de portada no válida.");
   if (data.amazonUrl && !amazonURL(data.amazonUrl)) throw Error("Utiliza un enlace HTTPS de Amazon.com.");
   if (data.price !== "" && (!Number.isFinite(Number(data.price)) || Number(data.price)<0)) throw Error("Precio no válido.");
   data.price = data.price === "" ? null : Number(data.price);
   data.published = $("book-published").checked;
   await setDoc(selected ? doc(db,"books",selected) : doc(collection(db,"books")),data,{merge:true});
   reset(); await refresh();
  });
 };
 $("book-delete").onclick = () => { if (selected && confirm("¿Eliminar este libro permanentemente?")) action(async()=>{ await deleteDoc(doc(db,"books",selected)); reset(); await refresh(); }); };
 $("book-import").onclick = () => action(async()=>{
  const response = await fetch("/data/books.json");
  if (!response.ok) throw Error("No se pudo leer el catálogo anterior.");
  const entries = (await response.json()).filter(b => typeof b.title === "string" && b.title.trim());
  for (const b of entries) {
   const ref = doc(db,"books","legacy-"+b.id);
   await runTransaction(db,async tx=>{ if (!(await tx.get(ref)).exists()) tx.set(ref,{title:b.title,author:b.author||"",description:b.description||"",cover:b.cover||"",published:b.published===true,price:null,amazonUrl:""}); });
  }
  await refresh();
 });
 reset();
 return action(refresh);
}
