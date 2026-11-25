// Keep the shared header alive; each route still has a complete standalone HTML document.
const routes=new Set(["/","/index.html","/pages/sobre.html","/pages/libros.html","/pages/eventos.html","/pages/contacto.html"]);
const header=document.querySelector(".site-header");
let root=document.getElementById("site-content"),sequence=0,controller;
const pathKey=p=>p==="/index.html"?"/":p;
const initializers={
 "/":async(root,url)=>{const [home,test]=await Promise.all([import("./home-public.js"),import("./testimonials-public.js")]);await Promise.all([home.initHome(root,url),test.initTestimonials(root)]);},
 "/pages/sobre.html":async root=>(await import("./biography-public.js")).initBiography(root),
 "/pages/libros.html":async(root,url)=>(await import("./books-public.js")).initBooks(root,url),
 "/pages/eventos.html":async root=>(await import("./events-public.js")).initEvents(root)
};
function initialize(content,url){
 const tasks=[import("./contact-public.js").then(m=>m.initContact(content))];
 if(initializers[pathKey(url.pathname)])tasks.push(initializers[pathKey(url.pathname)](content,url));
 Promise.allSettled(tasks).then(results=>{for(const result of results)if(result.status==="rejected")console.error("No se pudo cargar contenido",result.reason);});
}
function normalize(content,url){
 for(const el of content.querySelectorAll("[href],[src]"))for(const attr of ["href","src"]){
  const raw=el.getAttribute(attr);if(raw&&!raw.startsWith("#"))el.setAttribute(attr,new URL(raw,url).href);
 }
}
function activeTab(url){
 for(const link of header.querySelectorAll(".brand-navigation a")){
  if(pathKey(new URL(link.href).pathname)===pathKey(url.pathname))link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
 }
 const active=header.querySelector('[aria-current="page"]'),nav=header.querySelector(".brand-navigation");
 if(active&&nav){const a=active.getBoundingClientRect(),n=nav.getBoundingClientRect();if(a.left<n.left)nav.scrollLeft+=a.left-n.left;else if(a.right>n.right)nav.scrollLeft+=a.right-n.right;}
}
function metadata(doc){
 document.title=doc.title;
 for(const selector of ['meta[name="description"]','link[rel="canonical"]','meta[property^="og:"]','meta[name="twitter:card"]','script[type="application/ld+json"]']){
  document.head.querySelectorAll(selector).forEach(el=>el.remove());
  doc.head.querySelectorAll(selector).forEach(el=>document.head.append(document.importNode(el,true)));
 }
}
async function navigate(url,push){
 const id=++sequence;controller?.abort();controller=new AbortController();
 try{
  const response=await fetch(url.href,{signal:controller.signal});if(!response.ok)throw Error("HTTP "+response.status);
  const doc=new DOMParser().parseFromString(await response.text(),"text/html"),next=doc.getElementById("site-content");
  if(!next)throw Error("Invalid route");
  if(id!==sequence)return;
  const replacement=document.importNode(next,true);normalize(replacement,url);
  if(push)history.pushState(null,"",url.href);
  metadata(doc);root.replaceWith(replacement);root=replacement;
  activeTab(url);window.scrollTo(0,0);
  if(url.hash){const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));target?.scrollIntoView();}
  initialize(root,url);
 }catch(error){if(id!==sequence||error.name==="AbortError")return;location.assign(url.href);}
}
if(root&&header){
 const url=new URL(location.href);normalize(root,url);activeTab(url);initialize(root,url);
 document.addEventListener("click",event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest("a[href]");if(!link||link.hasAttribute("download")||(link.target&&link.target!=="_self"))return;
  const url=new URL(link.href);if(url.origin!==location.origin||!routes.has(url.pathname)||url.hash)return;
  event.preventDefault();if(url.href!==location.href)navigate(url,true);else if(controller){++sequence;controller.abort();}
 });
 window.addEventListener("popstate",()=>navigate(new URL(location.href),false));
}
