import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export default function AuthProvider1({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setRole("guest"); setLoading(false); return; }

      // 1) Ensure Firestore users/{uid} exists (default role=user)
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || "",
          photoURL: u.photoURL || "",
          role: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // keep profile fresh
        const data = snap.data();
        if (data.displayName !== u.displayName || data.photoURL !== u.photoURL) {
          await updateDoc(ref, {
            displayName: u.displayName || "",
            photoURL: u.photoURL || "",
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 2) Read role from **custom claims** (preferred for rules)
      //    If missing, fallback to Firestore doc so UI still works.
      await u.getIdToken(true); // refresh to get latest claims
      const token = await u.getIdTokenResult();
      const claimRole = token.claims.role;
      if (claimRole) setRole(claimRole);
      else {
        const fresh = await getDoc(ref);
        setRole((fresh.data()?.role) || "user");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => auth.signOut();

  return (
    <Ctx.Provider value={{ user, role, loading, loginWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}
