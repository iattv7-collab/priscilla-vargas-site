import { openWorkspace, closeWorkspace } from "./admin-workspace.js";
import { app, db, amazonURL, coverURL } from "./firebase-site.js";
import { collection, doc, getDocs, setDoc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js";
const storage = getStorage(app);
export function initBooks() {
 const $ = id => document.getElementById(id);
 const form = $("book-form"), list = $("book-list"), status = $("book-status");
 let selected = null, busy = false, pendingFile = null, previewObjectURL = null;
 const fileInput = $("cover-file"), preview = $("cover-preview"), drop = $("cover-drop");
 function showPreview() {
  if (previewObjectURL) URL.revokeObjectURL(previewObjectURL);
  previewObjectURL = pendingFile ? URL.createObjectURL(pendingFile) : null;
  const url = previewObjectURL || coverURL($("book-cover").value.trim());
  preview.hidden = !url;
  if (url) preview.src = url; else preview.removeAttribute("src");
 }
 function chooseFile(file) {
  if (busy || !file) return;
  if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size === 0 || file.size > 5*1024*1024) {
   fileInput.value = ""; pendingFile = null; showPreview(); status.textContent = "Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB."; return;
  }
  pendingFile = file; showPreview(); status.textContent = "Imagen seleccionada. Se subirá al guardar el libro.";
 }
 fileInput.onchange = () => { if (fileInput.files[0]) chooseFile(fileInput.files[0]); };
 drop.ondragover = e => { e.preventDefault(); if (!busy) drop.style.background="#fff2d4"; };
 drop.ondragleave = () => { drop.style.background=""; };
 drop.ondrop = e => { e.preventDefault(); drop.style.background=""; if (!busy && e.dataTransfer.files[0]) { fileInput.value=""; chooseFile(e.dataTransfer.files[0]); } };
 $("book-cover").oninput = () => { pendingFile=null; fileInput.value=""; showPreview(); };
 const fields = ["title","author","description","cover","amazonUrl"];
 function reset() { selected = null; form.reset(); $("book-author").value = "Apostle Priscilla Vargas"; $("book-delete").hidden = true; pendingFile=null; showPreview(); }
 function openEditor(title) {
  if(!openWorkspace("books")) return;
  $("book-editor-title").textContent=title;
  form.hidden=false; list.hidden=true; $("book-new").hidden=true; $("book-import").hidden=true;
  status.textContent=""; $("book-title").focus();
 }
 function closeEditor() {
  closeWorkspace("books");
  reset(); form.hidden=true; list.hidden=false; $("book-new").hidden=false;
  $("book-import").hidden=true;
 }
 function setBusy(value) { busy = value; for (const el of $("book-manager").querySelectorAll("button,input,textarea")) el.disabled = value; }
 async function refresh() {
  const snap = await getDocs(collection(db,"books"));
  list.replaceChildren();
  $("book-import").hidden = true;
  for (const d of snap.docs) {
   const b = d.data(), button = document.createElement("button");
   button.type = "button"; button.textContent = b.title + (b.published ? " — Publicado" : " — Borrador");
   button.addEventListener("click", () => {
    if (busy) return;
    reset(); selected = d.id;
    for (const key of fields) $("book-"+key).value = b[key] ?? "";
    $("book-published").checked = b.published === true;
    $("book-featured").checked = b.featured === true;
    $("book-delete").hidden = false;
    pendingFile=null; fileInput.value=""; showPreview();
    openEditor("Editar libro");
   });
   list.append(button, document.createElement("br"));
  }
  if (snap.empty) list.textContent = "No hay libros. Puedes agregar un nuevo libro.";
 }
 async function action(fn) {
  if (busy) return;
  setBusy(true); status.textContent = "Procesando…";
  try { await fn(); status.textContent = "Guardado correctamente."; }
  catch(e) { console.error(e); status.textContent = "No se pudo completar la operación. " + (e.message || ""); }
  finally { setBusy(false); }
 }
 $("book-new").onclick = () => { if(!busy){ reset(); openEditor("Nuevo libro"); } };
 $("book-cancel").onclick = () => { if(!busy && confirm("¿Cerrar el editor y descartar los cambios sin guardar?")) { closeEditor(); status.textContent=""; $("book-new").focus(); } };
 form.onsubmit = e => {
  e.preventDefault();
  if (busy || form.hidden || !confirm("¿Guardar los cambios de este libro?")) return;
  action(async () => {
   const data = Object.fromEntries(fields.map(k => [k,$("book-"+k).value.trim()]));
   if (!data.title) throw Error("El título es obligatorio.");
   if (data.cover && !coverURL(data.cover)) throw Error("URL de portada no válida.");
   if (data.amazonUrl && !amazonURL(data.amazonUrl)) throw Error("Utiliza un enlace HTTPS de Amazon.com.");
   data.published = $("book-published").checked;
   data.featured = $("book-featured").checked;
   if (data.featured && !data.published) throw Error("Publica el libro para destacarlo.");
   const ref = selected ? doc(db,"books",selected) : doc(collection(db,"books"));
   if (pendingFile) {
    const extensions = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    const object = storageRef(storage, "public/books/"+ref.id+"/"+crypto.randomUUID()+"."+extensions[pendingFile.type]);
    status.textContent = "Subiendo portada…";
    await uploadBytes(object,pendingFile,{contentType:pendingFile.type,cacheControl:"public,max-age=86400"});
    data.cover = await getDownloadURL(object);
    $("book-cover").value=data.cover;
    pendingFile=null; fileInput.value=""; showPreview();
   }
   if (data.featured) {
    const all = await getDocs(collection(db,"books"));
    await runTransaction(db, async tx => {
     for (const d of all.docs) if (d.id !== ref.id && d.data().featured === true) tx.update(d.ref,{featured:false});
     tx.set(ref,data,{merge:true});
    });
   } else await setDoc(ref,data,{merge:true});
   closeEditor(); await refresh();
  });
 };
 $("book-delete").onclick = () => { if (selected && confirm("¿Eliminar este libro permanentemente?")) action(async()=>{ await deleteDoc(doc(db,"books",selected)); closeEditor(); await refresh(); }); };

 closeEditor();
 return action(refresh);
}
