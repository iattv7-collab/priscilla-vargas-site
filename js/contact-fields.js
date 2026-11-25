export const contactFields=[
 ["email","Correo electrónico","contacto@priscillavargas.com"],
 ["heading","Título","Contacto"],
 ["subtitle","Subtítulo","Estamos aquí para servirte"],
 ["socialText","Texto de redes sociales","Síguenos en redes sociales para más contenido inspirador."],
 ["facebook","Facebook",""],["instagram","Instagram",""],["youtube","YouTube",""],["reddit","Reddit",""],["amazon","Perfil de autora en Amazon",""]
];
export const socialLabels={facebook:"Facebook",instagram:"Instagram",youtube:"YouTube",reddit:"Reddit",amazon:"Amazon"};
export function validEmail(s){return typeof s==="string"&&/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(s);}
export function socialURL(key,value){
 const domains={facebook:["facebook.com"],instagram:["instagram.com"],youtube:["youtube.com","youtu.be"],reddit:["reddit.com"],amazon:["amazon.com","amazon.es","amazon.com.mx"]};
 try{const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password||!domains[key]?.some(d=>u.hostname===d||u.hostname.endsWith("."+d)))return "";return u.href;}catch{return "";}
}
