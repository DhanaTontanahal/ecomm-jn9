// src/pages/ZohoItemsPage.jsx
import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    doc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ProductEditor } from "../components/admin/AdminProductManager"; // path adjust if needed

const BACKEND_BASE =
    import.meta.env.VITE_API_BASE ||
    "https://pfb-be-staging-1041275605700.us-central1.run.app";

// ---- helpers copied from AdminProductManager (or import them if you prefer) ----
const toSlug = (s = "") =>
    s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .replace(/^\-+|\-+$/g, "");

// "MIL-251009-0007"
function makeSku(categorySlug = "gen", seq = 1, d = new Date()) {
    const prefix = (categorySlug || "gen")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3)
        .padEnd(3, "X");
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const s = String(seq).padStart(4, "0");
    return `${prefix}-${yy}${mm}${dd}-${s}`;
}

// atomically increment global product counter
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

// Firestore product skeleton
function emptyProduct() {
    return {
        active: true,
        categoryId: null,
        categorySlug: "",
        title: "",
        subtitle: "",
        imageUrl: "",
        imagePath: "",
        sizeLabel: "L",
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

// Map Zoho item -> product draft
function mapZohoItemToProduct(zohoItem) {
    const base = emptyProduct();
    return {
        ...base,
        title: zohoItem.name || "",
        subtitle: zohoItem.description || "",
        mrp: Number(zohoItem.rate || 0),
        price: Number(zohoItem.rate || 0),
        stock: Number(zohoItem.stock_on_hand || 0),
        // keep SKU auto-generated on Firestore side
        // but store Zoho linkage:
        zohoItemId: zohoItem.item_id,
        zohoItemSku: zohoItem.sku,
    };
}

export default function ZohoItemsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // for publish modal
    const [publishItem, setPublishItem] = useState(null); // the Zoho item
    const [draftProduct, setDraftProduct] = useState(null); // initial product mapped from Zoho
    const [cats, setCats] = useState([]);
    const [catId, setCatId] = useState("");
    const [catSlug, setCatSlug] = useState("");
    const [saving, setSaving] = useState(false);

    // ---------- load Zoho items ----------
    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await fetch(`${BACKEND_BASE}/zoho/items`);
                const data = await res.json();
                if (!res.ok || !data.ok) {
                    throw new Error(data.error || "Failed to load Zoho items");
                }
                setItems(data.items || []);
            } catch (e) {
                console.error(e);
                setError(e.message || "Error loading Zoho items");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // ---------- load product categories for assigning in modal ----------
    useEffect(() => {
        async function loadCats() {
            try {
                const cSnap = await getDocs(
                    query(
                        collection(db, "productCategories"),
                        where("active", "==", true),
                        orderBy("order", "asc")
                    )
                );
                const list = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setCats(list);
            } catch (e) {
                console.error("Error loading categories", e);
            }
        }
        loadCats();
    }, []);

    function openPublishModal(zohoItem) {
        setPublishItem(zohoItem);
        setDraftProduct(mapZohoItemToProduct(zohoItem));
        setCatId("");
        setCatSlug("");
    }

    function closePublishModal() {
        setPublishItem(null);
        setDraftProduct(null);
        setCatId("");
        setCatSlug("");
        setSaving(false);
    }

    async function handleSaveFromEditor(editorPayload) {
        if (!catId) {
            alert("Please select a category before saving.");
            return;
        }
        const cat = cats.find((c) => c.id === catId);
        const slug = cat?.slug || toSlug(cat?.displayName || cat?.title || "gen");

        try {
            setSaving(true);

            const seq = await getNextProductSeq(db);
            const sku = makeSku(slug, seq, new Date());

            // editorPayload already has imageUrl/imagePath/mrp/price/etc.
            const finalDoc = {
                ...editorPayload,
                categoryId: catId,
                categorySlug: slug,
                sku,
                createdAt: serverTimestamp(),
                zohoItemId: publishItem?.item_id || null,
                zohoItemSku: publishItem?.sku || null,
            };

            // do not carry over any local id property
            delete finalDoc.id;

            await addDoc(collection(db, "products"), finalDoc);

            alert("Product published to Firestore store successfully.");
            closePublishModal();
        } catch (e) {
            console.error(e);
            alert(e.message || "Failed to save product.");
            setSaving(false);
        }
    }

    if (loading) return <p style={{ padding: 24 }}>Loading Zoho items…</p>;
    if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: 24 }}>
            <h2>Zoho Inventory Items</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
                Click <b>Publish to Sale</b> to send a Zoho item into your Firestore
                product catalog.
            </p>

            <div
                style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
            >
                {items.map((it) => (
                    <div
                        key={it.item_id}
                        style={{
                            border: "1px solid #1f2937",
                            borderRadius: 10,
                            padding: 12,
                            fontSize: 14,
                            background: "rgba(15,23,42,.85)",
                            color: "#e5e7eb",
                        }}
                    >
                        <strong style={{ fontSize: 15 }}>{it.name}</strong>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                            {it.description}
                        </div>
                        <div style={{ marginTop: 6 }}>SKU: {it.sku || "—"}</div>
                        <div>Stock: {it.stock_on_hand}</div>
                        <div>Rate: ₹ {it.rate}</div>

                        <button
                            style={{
                                marginTop: 10,
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                background: "#4ea1ff",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 500,
                                width: "100%",
                            }}
                            onClick={() => openPublishModal(it)}
                        >
                            Publish to Sale
                        </button>
                    </div>
                ))}
            </div>

            {/* === Publish modal === */}
            {publishItem && draftProduct && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.55)",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 9999,
                    }}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        style={{
                            width: "min(96vw, 920px)",
                            maxHeight: "90vh",
                            overflow: "auto",
                            background: "#0b1220",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,.12)",
                            padding: 16,
                            color: "#e5e7eb",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: 18 }}>
                                Publish Zoho Item to Store
                            </h3>
                            <button
                                onClick={closePublishModal}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#9ca3af",
                                    fontSize: 20,
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
                            Zoho Item: <b>{publishItem.name}</b> (SKU: {publishItem.sku})
                        </p>

                        {/* Category selector for Firestore product */}
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                Category (for your store)
                            </label>
                            <select
                                value={catId}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setCatId(id);
                                    const c = cats.find((x) => x.id === id);
                                    setCatSlug(c?.slug || "");
                                }}
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,.12)",
                                    background: "rgba(15,23,42,.9)",
                                    color: "#e5e7eb",
                                }}
                            >
                                <option value="">Select category…</option>
                                {cats.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.displayName || c.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reuse ProductEditor with initial mapped values */}
                        <ProductEditor
                            key={catId || "no-cat"} // remount if category changes so slug can be used for image path
                            product={{
                                ...draftProduct,
                                categoryId: catId || draftProduct.categoryId,
                                categorySlug: catSlug || draftProduct.categorySlug,
                            }}
                            onClose={closePublishModal}
                            onSave={handleSaveFromEditor}
                        />

                        {saving && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: "#9ca3af",
                                    textAlign: "right",
                                }}
                            >
                                Saving product…
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
