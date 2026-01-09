// src/components/admin/AdminProductManager.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  collection, getDocs, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, increment, runTransaction
} from "firebase/firestore";
import {
  getDownloadURL, ref, uploadBytesResumable, deleteObject
} from "firebase/storage";
import { db } from "../../firebase/firebase";
import { storage } from "../../firebase/firebase";
import { FiPlus, FiEdit2, FiTrash2, FiTrendingUp, FiTrendingDown, FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";


/* ===== Admin glass tokens ===== */
const COLORS = {
  glass: 'rgba(255,255,255,.06)',
  glassBorder: 'rgba(255,255,255,.12)',
  glassHeader: 'rgba(255,255,255,.10)',
  text: '#e7efff',
  subtext: '#b7c6e6',
  ring: '#78c7ff',
  primary: '#4ea1ff',
  danger: '#ef4444',
  ok: '#10b981',
  bg: '#0b1220',
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Wrap = styled.div`
  background: ${COLORS.bg};
  color: ${COLORS.text};
  padding: clamp(16px,3vw,24px);
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 14px;
  margin: 18px auto;
  max-width: 1280px;
`;
const Head = styled.div`
  display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;
  h2{margin:0; font-size:20px}
`;
const Row = styled.div`display:flex; gap:12px; flex-wrap:wrap; align-items:center;`;
const Select = styled.select`
  background:${COLORS.glassHeader};
  color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder};
  border-radius:10px;
  padding:8px 10px;
  min-width: 220px;
  color-scheme: dark;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${COLORS.ring} };
  option{ background:#121a2b; color:${COLORS.text}; }
  &:invalid{ color:${COLORS.subtext}; }
`;
const Button = styled.button`
  background:${p => p.$danger ? COLORS.danger : COLORS.primary}; color:white; border:none;
  border-radius:10px; padding:10px 12px; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const Table = styled.table`
  width:100%; border-collapse:collapse; margin-top:12px; font-size:14px; animation:${fade} .35s both;
  th,td{border-bottom:1px solid ${COLORS.glassBorder}; padding:10px; vertical-align:top}
  th{text-align:left; color:${COLORS.subtext}; font-weight:600}
  td img{width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid ${COLORS.glassBorder}}
  td .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
`;
const Input = styled.input`
  width:100%; background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:8px 10px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${COLORS.ring}};
`;
const SmallBtn = styled.button`
  display:inline-flex; align-items:center; gap:6px; padding:6px 8px; border-radius:8px; cursor:pointer;
  border:1px solid ${COLORS.glassBorder}; background:${COLORS.glassHeader}; color:${COLORS.text};
`;
const Label = styled.label`font-size:12px; color:${COLORS.subtext}; display:block; margin-bottom:6px;`;

const Blocker = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: grid; place-items: center;
  z-index: 9999;
`;
const Spinner = styled.div`
  width: 56px; height: 56px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,.25);
  border-top-color: ${COLORS.primary};
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;


const Notice = ({ children }) => (
  <div style={{
    border: `1px solid ${COLORS.glassBorder}`,
    background: COLORS.glassHeader,
    borderRadius: 12,
    padding: 16,
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 12
  }}>{children}</div>
);

const toSlug = (s = "") =>
  s.toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");

// Return like "MIL-251009-0007"  (MIL = category prefix, 25-10-09 = YYMMDD)
function makeSku(categorySlug = "gen", seq = 1, d = new Date()) {
  const prefix = (categorySlug || "gen").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const s = String(seq).padStart(4, "0");
  return `${prefix}-${yy}${mm}${dd}-${s}`;
}

// Atomically increment a global product counter and return the next sequence number
async function getNextProductSeq(db) {
  const ref = doc(db, "counters", "productSeq");
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data().value || 0 : 0;
    const next = current + 1;
    tx.set(ref, { value: next }, { merge: true });
    return next;
  });
  return seq;
}

function emptyProduct(catId, catSlug) {
  return {
    active: true,
    categoryId: catId,
    categorySlug: catSlug,
    title: "",
    subtitle: "",
    imageUrl: "",
    imagePath: "",
    sizeLabel: "1L",
    mrp: 0,
    price: 0,
    cashbackAmount: 0,
    rating: { avg: 4.8, count: 0 },
    stock: 0,
    order: 999,
    sku: "",
    createdAt: serverTimestamp(),
  };
}

export default function AdminProductManager() {
  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState("");
  const [catSlug, setCatSlug] = useState("");

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [editing, setEditing] = useState(null);
  const [addQty, setAddQty] = useState(0);
  const [subQty, setSubQty] = useState(0);

  const [busy, setBusy] = useState(false);          // global blocker while changing stock
  const [workingId, setWorkingId] = useState(null); // which product is being updated (optional)



  // 1) Load categories (ACTIVE, ordered)
  useEffect(() => {
    (async () => {
      const cSnap = await getDocs(
        query(collection(db, "productCategories"), where("active", "==", true), orderBy("order", "asc"))
      );
      const list = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCats(list);
      // keep no auto-select; user picks
    })();
  }, []);

  // 2) Load products for selected category
  useEffect(() => {
    if (!catId) { setRows([]); return; }
    (async () => {
      setLoadingRows(true);
      try {
        const qy = query(
          collection(db, "products"),
          where("categoryId", "==", catId),
          orderBy("order", "asc")
        );
        const s = await getDocs(qy);
        setRows(s.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoadingRows(false);
      }
    })();
  }, [catId]);

  const selectedCat = useMemo(() => cats.find(c => c.id === catId), [cats, catId]);

  // async function saveProduct(p) {
  //   if (!p.id) {
  //     const docRef = await addDoc(collection(db, "products"), { ...p, createdAt: serverTimestamp() });
  //     setRows(prev => [{ id: docRef.id, ...p }, ...prev]);
  //     if (!p.id) {
  //       // Create path — generate a unique SKU
  //       const seq = await getNextProductSeq(db);
  //       const sku = makeSku(p.categorySlug || "gen", seq, new Date());
  //       const payload = { ...p, sku, createdAt: serverTimestamp() };
  //       const docRef = await addDoc(collection(db, "products"), payload);
  //       setRows(prev => [{ id: docRef.id, ...payload }, ...prev]);
  //     } else {
  //       const { id, ...rest } = p;
  //       await updateDoc(doc(db, "products", id), rest);
  //       setRows(prev => prev.map(r => r.id === id ? p : r));
  //     }
  //     setEditing(null);
  //   }
  // }

  async function saveProduct(p) {
    if (!p.id) {
      // Create — generate SKU once, then add
      const seq = await getNextProductSeq(db);
      const sku = makeSku(p.categorySlug || "gen", seq, new Date());
      const payload = { ...p, sku, createdAt: serverTimestamp() };

      const docRef = await addDoc(collection(db, "products"), payload);
      setRows(prev => [{ id: docRef.id, ...payload }, ...prev]);
    } else {
      // Update — never mutate SKU
      const { id, ...rest } = p;
      await updateDoc(doc(db, "products", id), { ...rest, updatedAt: serverTimestamp() });
      setRows(prev => prev.map(r => (r.id === id ? p : r)));
    }
    setEditing(null);
  }


  async function removeProduct(prod) {
    if (!window.confirm("Delete this product?")) return;
    try {
      if (prod.imagePath) await deleteObject(ref(storage, prod.imagePath));
    } catch { /* ignore */ }
    await deleteDoc(doc(db, "products", prod.id));
    setRows(prev => prev.filter(r => r.id !== prod.id));
  }

  // async function adjustStock(prod, delta, reason = "manual") {
  //   if (!delta) return;
  //   const refDoc = doc(db, "products", prod.id);
  //   await updateDoc(refDoc, { stock: increment(delta) });
  //   await addDoc(collection(db, "stockTrail"), {
  //     productId: prod.id,
  //     delta,
  //     reason,
  //     at: serverTimestamp(),
  //   });
  //   setRows(prev => prev.map(r => r.id === prod.id ? { ...r, stock: (r.stock || 0) + delta } : r));
  // }

  async function adjustStock(prod, delta, reason = "manual") {
    const n = Number(delta || 0);
    if (!n) {
      toast?.warn?.("Enter a non-zero quantity.");
      return;
    }

    // ok for adds; for subtract ensure we don't go below 0
    setBusy(true);
    setWorkingId(prod.id);
    try {
      await runTransaction(db, async (tx) => {
        const pRef = doc(db, "products", prod.id);
        const snap = await tx.get(pRef);
        if (!snap.exists()) throw new Error("Product not found");

        const current = Number(snap.data().stock || 0);
        const next = current + n; // n can be + or -

        if (next < 0) {
          throw new Error(`Cannot reduce below zero. In stock: ${current}`);
        }

        tx.update(pRef, { stock: next, updatedAt: serverTimestamp() });

        // record inventory trace
        const trailRef = doc(collection(db, "stockTrail"));
        tx.set(trailRef, {
          productId: prod.id,
          delta: n,
          reason: reason === "add" ? "manual_add" : reason === "subtract" ? "manual_subtract" : reason,
          at: serverTimestamp(),
          afterStock: next,
          snap: { title: prod.title ?? null, sku: prod.sku ?? null },
          actor: "admin-ui",
        });

        // update local UI optimistically
        setRows((prev) => prev.map((r) => (r.id === prod.id ? { ...r, stock: next } : r)));
      });

      toast?.success?.("Inventory updated.");
    } catch (e) {
      console.error(e);
      toast?.error?.(e?.message || "Could not update inventory.");
    } finally {
      setBusy(false);
      setWorkingId(null);
    }
  }


  return (
    <Wrap>
      <Head>
        <h2>Admin · Product Manager</h2>
        <Row>
          <Select
            value={catId || ""}
            onChange={e => {
              const id = e.target.value;
              const c = cats.find(x => x.id === id);
              setCatId(id);
              setCatSlug(c?.slug || "");
            }}
            required
          >
            <option value="" disabled>Select category…</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.title}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => setEditing(emptyProduct(catId, catSlug))}
            disabled={!catId}
            title={catId ? "Add product to this category" : "Pick a category first"}
          >
            <FiPlus /> Add Product
          </Button>
        </Row>
      </Head>

      {/* Content states */}
      {!catId && <Notice>Select a category to view its products.</Notice>}
      {catId && loadingRows && <Notice>Loading products…</Notice>}
      {catId && !loadingRows && rows.length === 0 && (
        <Notice>
          No products added in <b>{selectedCat?.displayName || selectedCat?.title}</b> yet.
        </Notice>
      )}

      {catId && !loadingRows && rows.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>Product</th><th>Price</th><th>Stock</th><th>Order</th><th>Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td>
                  <Row>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" />
                    ) : (
                      <div style={{ width: 56, height: 56, background: "#222", borderRadius: 8 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: COLORS.subtext }}>{p.subtitle}</div>
                      <div style={{ fontSize: 12 }} className="mono">{p.sizeLabel}</div>
                      {p.sku && (
                        <div style={{ fontSize: 12, marginTop: 4 }} className="mono">SKU: {p.sku}</div>
                      )}
                    </div>
                  </Row>
                </td>
                <td>
                  <div><span className="mono">MRP</span>: ₹ {p.mrp}</div>
                  <div><b>Price</b>: ₹ {p.price}</div>
                  <div style={{ fontSize: 12, color: COLORS.subtext }}>
                    Cashback: ₹ {p.cashbackAmount ?? Math.round((p.price || 0) * 0.10)}
                  </div>
                </td>
                {/* <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SmallBtn onClick={() => adjustStock(p, +Number(addQty || 0), "add")}>
                      <FiTrendingUp /> +Add
                    </SmallBtn>
                    <Input style={{ width: 72 }} type="number" value={addQty} onChange={e => setAddQty(e.target.value)} />
                  </div>
                  <div style={{ height: 6 }} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SmallBtn onClick={() => adjustStock(p, -Number(subQty || 0), "subtract")}>
                      <FiTrendingDown /> -Sub
                    </SmallBtn>
                    <Input style={{ width: 72 }} type="number" value={subQty} onChange={e => setSubQty(e.target.value)} />
                  </div>
                  <div style={{ marginTop: 6 }}>Current: <b>{p.stock ?? 0}</b></div>
                </td> */}
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SmallBtn
                      disabled={busy}
                      onClick={() => adjustStock(p, +Number(addQty || 0), "add")}
                      title="Add to inventory"
                    >
                      <FiTrendingUp /> +Add
                    </SmallBtn>
                    <Input
                      style={{ width: 72 }}
                      type="number"
                      value={addQty}
                      onChange={e => setAddQty(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <div style={{ height: 6 }} />

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SmallBtn
                      disabled={busy}
                      onClick={() => adjustStock(p, -Number(subQty || 0), "subtract")}
                      title="Reduce from inventory"
                    >
                      <FiTrendingDown /> -Sub
                    </SmallBtn>
                    <Input
                      style={{ width: 72 }}
                      type="number"
                      value={subQty}
                      onChange={e => setSubQty(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                </td>
                <td>{p.order ?? 999}</td>
                <td>{p.active ? "Yes" : "No"}</td>
                <td>
                  <Row>
                    <SmallBtn onClick={() => setEditing(p)}><FiEdit2 /> Edit</SmallBtn>
                    <SmallBtn onClick={() => removeProduct(p)}><FiTrash2 /> Delete</SmallBtn>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {editing && (
        <Editor product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />
      )}

      {busy && (
        <Blocker aria-label="Updating inventory">
          <div style={{ display: "grid", gap: 10, justifyItems: "center", color: "#fff" }}>
            <Spinner />
            <div>Updating inventory…</div>
          </div>
        </Blocker>
      )}

    </Wrap>
  );
}

/* ===== Inline editor with image upload ===== */
function Editor({ product, onSave, onClose }) {
  const [form, setForm] = useState(product);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const previewUrl = file ? URL.createObjectURL(file) : (form.imageUrl || "");

  async function uploadImageIfNeeded() {
    if (!file) return { url: form.imageUrl || "", path: form.imagePath || "" };

    try { if (form.imagePath) await deleteObject(ref(storage, form.imagePath)); } catch { }
    const base = `products/${form.categorySlug || "uncategorized"}`;
    const path = `${base}/${Date.now()}-${toSlug(file.name)}`;
    const storageRef = ref(storage, path);
    setUploading(true);
    setProgress(0);
    const task = uploadBytesResumable(storageRef, file, { cacheControl: "public,max-age=31536000" });

    await new Promise((resolve, reject) => {
      task.on("state_changed",
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        resolve
      );
    });

    const url = await getDownloadURL(task.snapshot.ref);
    setUploading(false);
    return { url, path };
  }

  async function handleSave() {
    const { url, path } = await uploadImageIfNeeded();
    const payload = {
      ...form,
      imageUrl: url,
      imagePath: path,
      mrp: Number(form.mrp || 0),
      price: Number(form.price || 0),
      cashbackAmount: form.cashbackAmount === "" ? null : Number(form.cashbackAmount || 0),
      stock: Number(form.stock || 0),
      order: Number(form.order || 0),
      updatedAt: serverTimestamp(),
    };
    onSave(payload);
  }

  function clearSelectedFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{
      marginTop: 16, padding: 16, border: `1px solid ${COLORS.glassBorder}`,
      borderRadius: 12, background: COLORS.glassHeader
    }}>
      <Row style={{ marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <Label>Title</Label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <Label>Subtitle</Label>
          <Input value={form.subtitle} onChange={e => set("subtitle", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Size Label</Label>
          <Input value={form.sizeLabel} onChange={e => set("sizeLabel", e.target.value)} placeholder="e.g., 1L / 5L" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Order</Label>
          <Input type="number" value={form.order || 0} onChange={e => set("order", Number(e.target.value))} />
        </div>
      </Row>
      <Row style={{ marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>SKU</Label>
          <Input value={form.sku || ""} readOnly placeholder="Will be auto-generated on save" />
        </div>
      </Row>


      <Row style={{ marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>MRP</Label>
          <Input type="number" value={form.mrp || 0} onChange={e => set("mrp", Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Sale Price</Label>
          <Input type="number" value={form.price || 0} onChange={e => set("price", Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Cashback Amount (₹)</Label>
          <Input type="number" value={form.cashbackAmount ?? ""} onChange={e => set("cashbackAmount", e.target.value === "" ? "" : Number(e.target.value))} placeholder="optional" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Stock</Label>
          <Input type="number" value={form.stock || 0} onChange={e => set("stock", Number(e.target.value))} />
        </div>
      </Row>

      {/* Image upload */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "end", marginBottom: 12 }}>
        <div>
          <Label>Product Image</Label>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          {uploading && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <FiUpload /> Uploading… {progress}%
              <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 6, overflow: "hidden", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: COLORS.primary }} />
              </div>
            </div>
          )}
          {!!file && (
            <div style={{ marginTop: 8 }}>
              <SmallBtn onClick={clearSelectedFile}><FiX /> Clear selected file</SmallBtn>
            </div>
          )}
        </div>
        <div>          {previewUrl ? (
          <img
            src={previewUrl}
            alt="preview"
            style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, border: `1px solid ${COLORS.glassBorder}` }}
          />
        ) : (
          <div style={{ width: "100%", height: 140, borderRadius: 10, border: `1px solid ${COLORS.glassBorder}`, background: "#1b2232" }} />
        )}
        </div>
      </div>

      <Row style={{ alignItems: "center", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>Active</Label>
          <Select value={form.active ? "1" : "0"} onChange={e => set("active", e.target.value === "1")}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Select>
        </div>
      </Row>

      <Row style={{ justifyContent: "flex-end", gap: 10 }}>
        <SmallBtn onClick={onClose}>Cancel</SmallBtn>
        <Button onClick={handleSave} disabled={uploading}><FiUpload /> Save</Button>
      </Row>
    </div>
  );
}
