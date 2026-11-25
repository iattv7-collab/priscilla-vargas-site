export function youtubeId(value){
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password)return "";
  const host=u.hostname.toLowerCase(),parts=u.pathname.split("/").filter(Boolean);
  let id="";
  if(host==="youtu.be")id=parts[0];
  else if(["youtube.com","www.youtube.com","m.youtube.com","www.youtube-nocookie.com"].includes(host)){
   if(parts[0]==="watch")id=u.searchParams.get("v");
   else if(["shorts","embed","live"].includes(parts[0]))id=parts[1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id||"")?id:"";
 }catch{return "";}
}
