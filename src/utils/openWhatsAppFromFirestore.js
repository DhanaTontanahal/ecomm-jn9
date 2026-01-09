// src/utils/openWhatsAppFromFirestore.js
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

// Expected doc: site / whatsappChatFab  => { phone: "9198xxxxxxx", defaultText: "Hi Team..." }
export async function openWhatsAppFromFirestore() {
    try {
        const snap = await getDoc(doc(db, "site", "whatsappChatFab"));
        const phone = snap.exists() ? (snap.data().phone || "") : "";
        const text = snap.exists() ? (snap.data().defaultText || "Hi Team, I need help.") : "Hi Team, I need help.";
        if (!phone) {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            return;
        }
        window.open(`https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`, "_blank");
    } catch {
        window.open(`https://wa.me/?text=${encodeURIComponent("Hi Team, I need help.")}`, "_blank");
    }
}
