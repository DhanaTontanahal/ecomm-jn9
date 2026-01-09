// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
    const auth = getAuth();

    const [user, setUser] = useState(null);
    const [userDoc, setUserDoc] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingDoc, setLoadingDoc] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u || null);
            setLoadingAuth(false);
        });
        return unsub;
    }, [auth]);

    useEffect(() => {
        if (!user) { setUserDoc(null); setLoadingDoc(false); return; }
        setLoadingDoc(true);
        const ref = doc(db, "users", user.uid);
        const unsub = onSnapshot(ref, (snap) => {
            setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoadingDoc(false);
        }, () => setLoadingDoc(false));
        return unsub;
    }, [user]);

    async function loginWithGoogle(mode = "popup") {
        const provider = new GoogleAuthProvider();
        if (mode === "popup") {
            return await signInWithPopup(auth, provider); // returns { user, ... }
        }
        // (redirect flow can be added later)
    }

    async function logout() {
        await signOut(auth);
    }

    const value = useMemo(() => ({
        user,
        userDoc,
        role: userDoc?.role ?? "user",
        loading: loadingAuth || loadingDoc,
        loginWithGoogle,
        logout,
    }), [user, userDoc, loadingAuth, loadingDoc]);

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
