// src/pages/SearchResults.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    collection, getDocs, query, where, orderBy, startAt, endAt, limit as qLimit
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const Grid = ({ children }) => (
    <div style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        padding: "14px 12px",
    }}>
        {children}
    </div>
);

const Card = ({ p, onClick }) => (
    <button
        onClick={onClick}
        style={{
            textAlign: "left",
            border: "1px solid rgba(0,0,0,.08)",
            borderRadius: 12,
            background: "#fff",
            padding: 10,
            cursor: "pointer"
        }}
    >
        <div style={{
            aspectRatio: "1/1",
            width: "100%",
            overflow: "hidden",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.06)",
            marginBottom: 8
        }}>
            <img
                src={p.imageUrl || p.thumbnailUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
            />
        </div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
        {p.price != null && (
            <div style={{ color: "#6b7280", fontSize: 12 }}>₹ {Number(p.price).toLocaleString("en-IN")}</div>
        )}
    </button>
);

export default function SearchResults() {
    const nav = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    // accept either ?q= or ?query=
    const qText = (params.get("q") || params.get("query") || "").trim();
    const qLower = qText.toLowerCase();

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");

    const fetchSearch = async () => {
        if (!qLower) { setRows([]); return; }
        setLoading(true);
        setError("");
        try {
            // Preferred: indexed prefix search on nameLower
            const ref = collection(db, "products");
            const qy = query(
                ref,
                where("active", "==", true),
                orderBy("nameLower"),
                startAt(qLower),
                endAt(qLower + "\uf8ff"),
                qLimit(60)
            );
            const snap = await getDocs(qy);

            // If index missing, Firebase throws; we catch below & fallback.
            const list = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
            setRows(list);
        } catch (e) {
            // Fallback: fetch a window & filter client-side
            try {
                const ref = collection(db, "products");
                const snap = await getDocs(
                    query(ref, where("active", "==", true), orderBy("createdAt", "desc"), qLimit(120))
                );
                const list = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
                const filtered = list
                    .map(x => ({ ...x, nameLower: (x.nameLower || x.name || "").toString().toLowerCase() }))
                    .filter(x => x.nameLower.includes(qLower));
                setRows(filtered);
            } catch (err) {
                setError("Could not fetch search results.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSearch(); /* eslint-disable-next-line */ }, [qLower]);

    const title = useMemo(() => (
        qText ? `Search results for “${qText}”` : "Search"
    ), [qText]);

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 12px" }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 2px"
            }}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                {qText && (
                    <button
                        onClick={() => nav("/search")}
                        style={{ border: "1px solid rgba(0,0,0,.1)", background: "#fff", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {loading && <div style={{ padding: 12 }}>Loading…</div>}
            {error && <div style={{ color: "#ef4444", padding: 12 }}>{error}</div>}

            {!loading && !error && rows.length === 0 && qText && (
                <div style={{ padding: 12 }}>No products found. Try another term.</div>
            )}

            {!loading && rows.length > 0 && (
                <Grid>
                    {rows.map(p => (
                        <Card
                            key={p.id}
                            p={p}
                            onClick={() => {
                                // If you have a product details page, navigate there:
                                // nav(`/product/${p.id}`);
                            }}
                        />
                    ))}
                </Grid>
            )}
        </div>
    );
}
