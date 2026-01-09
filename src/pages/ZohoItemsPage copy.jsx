// src/pages/ZohoItemsPage.jsx
import React, { useEffect, useState } from "react";

const BACKEND_BASE =
    import.meta.env.VITE_API_BASE ||
    "https://pfb-be-staging-1041275605700.us-central1.run.app";

export default function ZohoItemsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    if (loading) return <p>Loading Zoho items…</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: 24 }}>
            <h2>Zoho Inventory Items</h2>
            <div
                style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
            >
                {items.map((it) => (
                    <div
                        key={it.item_id}
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 14,
                        }}
                    >
                        <strong>{it.name}</strong>
                        <div>SKU: {it.sku}</div>
                        <div>Stock: {it.stock_on_hand}</div>
                        <div>Rate: {it.rate}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
