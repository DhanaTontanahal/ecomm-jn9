// src/pages/ZohoItemsPage.jsx
import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import ZohoPublishProductModal from "../components/ZohoPublishProductModal";

const BACKEND_BASE =
    import.meta.env.VITE_API_BASE ||
    "https://pfb-be-staging-1041275605700.us-central1.run.app";

export default function ZohoItemsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cats, setCats] = useState([]);
    const [publishItem, setPublishItem] = useState(null); // which Zoho item is being published

    // load Zoho items
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

    // load categories for the modal
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

    if (loading) return <p style={{ padding: 24 }}>Loading Zoho items…</p>;
    if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;


    console.log(items)
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

                {items.map((it) => {
                    const img =
                        it.image_url || it.image || it.product_image || it.product_image_url || "";

                    return (
                        <div
                            key={it.item_id}
                            item_id={it.item_id}
                            style={{
                                border: "1px solid #1f2937",
                                borderRadius: 10,
                                padding: 12,
                                fontSize: 14,
                                background: "rgba(15,23,42,.85)",
                                color: "#e5e7eb",
                            }}
                        >
                            {/* top row with image + basic info */}
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                {img ? (
                                    <img
                                        src={img}
                                        alt={it.name}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            border: "1px solid rgba(148,163,184,.4)",
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 8,
                                            background: "rgba(15,23,42,.8)",
                                            border: "1px solid rgba(148,163,184,.25)",
                                            flexShrink: 0,
                                        }}
                                    />
                                )}

                                <div>
                                    <strong style={{ fontSize: 15 }}>{it.name}</strong>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#9ca3af",
                                            marginTop: 4,
                                        }}
                                    >
                                        {it.description}
                                    </div>
                                </div>
                            </div>

                            {/* meta below */}
                            <div style={{ marginTop: 6, fontSize: 13 }}>
                                <div>SKU: {it.sku || "—"}</div>
                                <div>Stock: {it.stock_on_hand}</div>
                                <div>Rate: ₹ {it.rate}</div>
                                <div>Item ID: ₹ {it.item_id}</div>
                                <small>Item Id is very important for zoho to track sales orders</small>
                            </div>

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
                                onClick={() => setPublishItem(it)}
                            >
                                Publish to Sale
                            </button>
                        </div>
                    );
                })}




            </div>

            {/* Zoho publish modal (separate editor file) */}
            <ZohoPublishProductModal
                open={!!publishItem}
                zohoItem={publishItem}
                categories={cats}
                onClose={() => setPublishItem(null)}
                onSaved={() => {
                    // optional: do something after save (e.g. show tick, refresh products, etc.)
                    setPublishItem(null);
                }}
            />
        </div>
    );
}
