// src/hooks/useDoc.js
import { useEffect, useRef, useState, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase"; // ensure single source

export function useDoc(pathA, pathB) {
  const [data, setData] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const ref = doc(db, pathA, pathB);
  const didFirstLoad = useRef(false);

  const fetchDoc = useCallback(async ({ silent = false } = {}) => {
    setErr("");
    // First load shows big spinner; later loads are "refreshing"
    if (!didFirstLoad.current && !silent) {
      setInitializing(true);
    } else {
      setRefreshing(true);
    }

    try {
      const snap = await getDoc(ref);
      setData(snap.exists() ? snap.data() : null);
      didFirstLoad.current = true;
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setInitializing(false);
      setRefreshing(false);
    }
  }, [ref]);

  const saveDoc = useCallback(
    async (payload, { optimistic = true, refetch = true } = {}) => {
      // Optimistic: update local state immediately for zero flicker
      if (optimistic) {
        setData((prev) => ({ ...(prev || {}), ...payload }));
      }
      await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });

      // Background refresh to pick up serverTimestamp
      if (refetch) await fetchDoc({ silent: true });
    },
    [ref, fetchDoc]
  );

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  return { data, initializing, refreshing, err, saveDoc, ref, refetch: fetchDoc };
}
