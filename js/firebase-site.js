import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
export const app = initializeApp({
 apiKey: "AIzaSyBT9XQP1W_agcc6YyVdwSIRwpIKI4oyqaI",
 authDomain: "priscilla-vargas.firebaseapp.com",
 projectId: "priscilla-vargas",
 storageBucket: "priscilla-vargas.firebasestorage.app",
 messagingSenderId: "332544919827",
 appId: "1:332544919827:web:caf0403849b334b39ff2e6"
});
export const db = getFirestore(app);
export function coverURL(value) {
 if (!value) return "";
 try { const u = new URL(value, location.origin + "/"); return (u.protocol === "https:" || (u.origin === location.origin && u.pathname.startsWith("/images/"))) ? u.href : ""; } catch { return ""; }
}
export function amazonURL(value) {
 try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && (u.hostname === "amazon.com" || u.hostname.endsWith(".amazon.com") || u.hostname === "a.co") ? u.href : ""; } catch { return ""; }
}
