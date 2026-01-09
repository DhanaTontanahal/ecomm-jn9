// src/pages/ZohoItemsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import ZohoPublishProductModal from "../components/ZohoPublishProductModal";
import ZohoConnectButton from "../components/ZohoConnectButton";

const BACKEND_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://pfb-be-staging-1041275605700.us-central1.run.app";

// --- small helper: decide whether user needs to connect Zoho ---
function isZohoAuthProblem(res, data) {
  if (res?.status === 401 || res?.status === 403) return true;

  const msg =
    (data?.error || data?.message || data?.details || "").toString().toLowerCase();

  return (
    msg.includes("token") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("expired") ||
    msg.includes("invalid_grant") ||
    msg.includes("authentication") ||
    msg.includes("no_zoho") ||
    msg.includes("connect zoho")
  );
}

export default function ZohoItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [needsZohoConnect, setNeedsZohoConnect] = useState(false);
  const [error, setError] = useState("");

  const [cats, setCats] = useState([]);
  const [publishItem, setPublishItem] = useState(null);

  // Optional: read callback query (?status=success or ?status=error)
  const callbackStatus = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("status"); // success | error | null
    } catch {
      return null;
    }
  }, []);

  // load Zoho items
  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      setNeedsZohoConnect(false);

      const res = await fetch(`${BACKEND_BASE}/zoho/items`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // if token missing/expired -> show connect UI instead of red error
        if (isZohoAuthProblem(res, data)) {
          setNeedsZohoConnect(true);
          return;
        }
        throw new Error(data.error || data.message || "Failed to load Zoho items");
      }

      setItems(data.items || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error loading Zoho items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if Zoho callback says success, reload items automatically
  useEffect(() => {
    if (callbackStatus === "success") {
      loadItems();
      // clean URL (remove ?status=success)
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("status");
        u.searchParams.delete("message");
        window.history.replaceState({}, "", u.toString());
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callbackStatus]);

  // load categories for the modal (same as your code)
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

  // ✅ CONNECT ZOHO INSIDE THE SAME PAGE (when token missing/expired)
  if (needsZohoConnect) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 6 }}>Connect Zoho Inventory</h2>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
          Your Zoho token is missing or expired. Connect again to load Zoho items.
        </p>

        <div
          style={{
            maxWidth: 520,
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 16,
            background: "rgba(15,23,42,.85)",
            color: "#e5e7eb",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            Zoho not connected
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
            Click below to connect Zoho. After successful login, you’ll return here and the items will load.
          </div>

          <ZohoConnectButton />

          <button
            onClick={loadItems}
            style={{
              marginTop: 12,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,.3)",
              background: "transparent",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              width: "100%",
            }}
          >
            Retry Loading Items
          </button>
        </div>
      </div>
    );
  }

  if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Zoho Inventory Items</h2>
      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Click <b>Publish to Sale</b> to send a Zoho item into your Firestore product catalog.
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
              style={{
                border: "1px solid #1f2937",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                background: "rgba(15,23,42,.85)",
                color: "#e5e7eb",
              }}
            >
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
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    {it.description}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 6, fontSize: 13 }}>
                <div>SKU: {it.sku || "—"}</div>
                <div>Stock: {it.stock_on_hand}</div>
                <div>Rate: ₹ {it.rate}</div>
                <div>Item ID: {it.item_id}</div>
                <small>Item Id is very important for Zoho to track sales orders</small>
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

      <ZohoPublishProductModal
        open={!!publishItem}
        zohoItem={publishItem}
        categories={cats}
        onClose={() => setPublishItem(null)}
        onSaved={() => setPublishItem(null)}
      />
    </div>
  );
}
