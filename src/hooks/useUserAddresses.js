// src/hooks/useUserAddresses.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection, doc, onSnapshot, orderBy, query,
  addDoc, setDoc, deleteDoc, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";

export function useUserAddresses() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [loading, setLoading] = useState(true);

  // live subscribe
  useEffect(() => {
    if (!uid) { setAddresses([]); setDefaultAddressId(null); setLoading(false); return; }

    const addrCol = collection(db, "users", uid, "addresses");
    const unsubA = onSnapshot(query(addrCol, orderBy("createdAt", "asc")), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAddresses(rows);
      setLoading(false);
    });

    const unsubU = onSnapshot(doc(db, "users", uid), (snap) => {
      setDefaultAddressId(snap.data()?.defaultAddressId || null);
    });

    return () => { unsubA(); unsubU(); };
  }, [uid]);

  const addAddress = useCallback(async (payload) => {
    if (!uid) return null;
    const ref = await addDoc(collection(db, "users", uid, "addresses"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    // first address becomes default
    if (addresses.length === 0) {
      await setDoc(doc(db, "users", uid), { defaultAddressId: ref.id, updatedAt: serverTimestamp() }, { merge: true });
    }
    return ref.id;
  }, [uid, addresses.length]);

  const updateAddress = useCallback(async (id, data) => {
    if (!uid || !id) return;
    await setDoc(doc(db, "users", uid, "addresses", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }, [uid]);

  const removeAddress = useCallback(async (id) => {
    if (!uid || !id) return;
    await deleteDoc(doc(db, "users", uid, "addresses", id));
    // if you removed default, clear or switch to first remaining
    if (defaultAddressId === id) {
      const newDefault = addresses.find(a => a.id !== id)?.id || null;
      await setDoc(doc(db, "users", uid), { defaultAddressId: newDefault, updatedAt: serverTimestamp() }, { merge: true });
    }
  }, [uid, defaultAddressId, addresses]);

  const setDefaultAddress = useCallback(async (id) => {
    if (!uid || !id) return;
    const batch = writeBatch(db);
    batch.set(doc(db, "users", uid), { defaultAddressId: id, updatedAt: serverTimestamp() }, { merge: true });
    addresses.forEach(a => {
      batch.set(doc(db, "users", uid, "addresses", a.id), { isDefault: a.id === id }, { merge: true });
    });
    await batch.commit();
    setDefaultAddressId(id);
  }, [uid, addresses]);

  return {
    user, uid,
    addresses, defaultAddressId,
    loading,
    addAddress, updateAddress, removeAddress, setDefaultAddress,
  };
}
