// src/pages/DeliveryAgentOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
    FiRefreshCw,
    FiPhone,
    FiMapPin,
    FiTruck,
    FiCheckCircle,
    FiMinusCircle,
} from "react-icons/fi";

/* ===== Reuse admin glass tokens ===== */
const COLORS = {
    glass: "rgba(255,255,255,.06)",
    glassBorder: "rgba(255,255,255,.12)",
    glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff",
    subtext: "#b7c6e6",
    ring: "#78c7ff",
    primary: "#4ea1ff",
    danger: "#ef4444",
    ok: "#10b981",
    warn: "#f59e0b",
    bg: "#020617",
};

const fade = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ===== Layout ===== */
const Page = styled.div`
  max-width: 900px;
  margin: 16px auto;
  padding: 12px 14px 32px;
  background: radial-gradient(circle at top, #0f172a, ${COLORS.bg});
  color: ${COLORS.text};
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const TitleBlock = styled.div`
  h2 {
    margin: 0;
    font-size: 18px;
  }
  p {
    margin: 2px 0 0;
    font-size: 12px;
    color: ${COLORS.subtext};
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SmallBtn = styled.button`
  background: ${COLORS.glassHeader};
  color: ${COLORS.text};
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 999px;
  padding: 7px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${COLORS.ring};
  }
`;

const FilterTabs = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: ${COLORS.glassHeader};
  border: 1px solid ${COLORS.glassBorder};
`;

const TabBtn = styled.button`
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#1d283a" : "transparent")};
`;

/* ===== Cards ===== */
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  animation: ${fade} 0.3s both;
`;

const Card = styled.div`
  border-radius: 14px;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glassHeader};
  padding: 10px 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;

  @media (min-width: 640px) {
    grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.4fr);
  }
`;

const Line = styled.div`
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const Label = styled.span`
  color: ${COLORS.subtext};
  font-size: 12px;
`;

const Strong = styled.span`
  font-weight: 600;
`;

const StatusBadge = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 11px;
  background: ${(p) =>
    ({
        NEW: "rgba(78,161,255,.18)",
        PROCESSING: "rgba(245,158,11,.18)",
        FULFILLED: "rgba(16,185,129,.18)",
        CANCELLED: "rgba(239,68,68,.18)",
    }[p.$s] || COLORS.glassHeader)};
  color: ${(p) =>
    ({
        NEW: "#93c5fd",
        PROCESSING: "#fbbf24",
        FULFILLED: "#34d399",
        CANCELLED: "#f87171",
    }[p.$s] || COLORS.subtext)};
`;

const Tag = styled.span`
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid ${COLORS.glassBorder};
  color: ${COLORS.subtext};
`;

const ActionsCol = styled.div`
  display: grid;
  gap: 6px;
  align-content: start;
`;

const PrimaryBtn = styled.button`
  border-radius: 999px;
  border: none;
  padding: 8px 10px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${(p) =>
        p.$danger ? COLORS.danger : p.$ok ? COLORS.ok : COLORS.primary};
  color: #fff;
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryBtn = styled.button`
  border-radius: 999px;
  border: 1px solid ${COLORS.glassBorder};
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  color: ${COLORS.text};
`;

/* ===== Helpers ===== */
function formatTime(ts) {
    if (!ts) return "-";
    const d = ts?.seconds
        ? new Date(ts.seconds * 1000)
        : ts?.toDate
            ? ts.toDate()
            : new Date(ts);
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(ts) {
    if (!ts) return "-";
    const d = ts?.seconds
        ? new Date(ts.seconds * 1000)
        : ts?.toDate
            ? ts.toDate()
            : new Date(ts);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    });
}

function isToday(ts) {
    if (!ts) return false;
    const d = ts?.seconds
        ? new Date(ts.seconds * 1000)
        : ts?.toDate
            ? ts.toDate()
            : new Date(ts);

    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

const money = (v) =>
    `₹ ${Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

/**
 * DeliveryAgentOrders
 * @param {string} deliveryBoyId - id from deliveryBoys collection
 * @param {string} deliveryBoyName - optional: show in header
 */
export default function DeliveryAgentOrders({
    deliveryBoyId,
    deliveryBoyName,
}) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("PENDING"); // PENDING | TODAY | COMPLETED

    // ---- live query for this rider ----
    useEffect(() => {
        if (!deliveryBoyId) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const qRef = query(
            collection(db, "orders"),
            where("deliveryAssignee.id", "==", deliveryBoyId),
            orderBy("createdAt", "desc"),
            limit(200)
        );

        const unsub = onSnapshot(
            qRef,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setOrders(list);
                setLoading(false);
            },
            (err) => {
                console.error("DeliveryAgentOrders snapshot error", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [deliveryBoyId]);

    const filtered = useMemo(() => {
        let arr = [...orders];
        if (tab === "PENDING") {
            arr = arr.filter(
                (o) => (o.status || "NEW") !== "FULFILLED" && (o.status || "NEW") !== "CANCELLED"
            );
        } else if (tab === "TODAY") {
            arr = arr.filter((o) => isToday(o.createdAt));
        } else if (tab === "COMPLETED") {
            arr = arr.filter((o) => (o.status || "NEW") === "FULFILLED");
        }
        return arr;
    }, [orders, tab]);

    const stats = useMemo(() => {
        const pending = orders.filter(
            (o) => (o.status || "NEW") !== "FULFILLED" && (o.status || "NEW") !== "CANCELLED"
        ).length;
        const completedToday = orders.filter(
            (o) => (o.status || "NEW") === "FULFILLED" && isToday(o.fulfilledAt)
        ).length;
        return { pending, completedToday, total: orders.length };
    }, [orders]);

    async function updateStatus(orderId, nextStatus) {
        const ref = doc(db, "orders", orderId);
        const patch = {
            status: nextStatus,
            updatedAt: serverTimestamp(),
            ...(nextStatus === "FULFILLED" ? { fulfilledAt: serverTimestamp() } : {}),
            ...(nextStatus === "CANCELLED" ? { cancelledAt: serverTimestamp() } : {}),
        };

        await updateDoc(ref, patch);

        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
        );
    }

    function callCustomer(phone) {
        if (!phone) return;
        window.location.href = `tel:${phone}`;
    }

    return (
        <Page>
            <Head>
                <TitleBlock>
                    <h2>My Deliveries</h2>
                    <p>
                        {deliveryBoyName
                            ? `Signed in as ${deliveryBoyName}.`
                            : "Deliver the orders assigned to you."}{" "}
                        Pending: <strong>{stats.pending}</strong> • Completed today:{" "}
                        <strong>{stats.completedToday}</strong>
                    </p>
                </TitleBlock>

                <ActionsRow>
                    <FilterTabs>
                        <TabBtn $active={tab === "PENDING"} onClick={() => setTab("PENDING")}>
                            Pending
                        </TabBtn>
                        <TabBtn $active={tab === "TODAY"} onClick={() => setTab("TODAY")}>
                            Today
                        </TabBtn>
                        <TabBtn
                            $active={tab === "COMPLETED"}
                            onClick={() => setTab("COMPLETED")}
                        >
                            Completed
                        </TabBtn>
                    </FilterTabs>

                    <SmallBtn onClick={() => window.location.reload()}>
                        <FiRefreshCw /> Refresh
                    </SmallBtn>
                </ActionsRow>
            </Head>

            {loading && (
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 8 }}>
                    Loading your assigned orders…
                </div>
            )}

            {!loading && !deliveryBoyId && (
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 8 }}>
                    No delivery profile detected. Pass <code>deliveryBoyId</code> to this
                    component or map the logged-in user to a deliveryBoys record.
                </div>
            )}

            {!loading && deliveryBoyId && filtered.length === 0 && (
                <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 8 }}>
                    No orders in this view. Try switching to another tab.
                </div>
            )}

            <List>
                {filtered.map((o) => {
                    const items = Array.isArray(o.items) ? o.items : [];
                    const totalQty = items.reduce(
                        (s, it) => s + Number(it.qty || 0),
                        0
                    );
                    const status = o.status || "NEW";

                    return (
                        <Card key={o.id}>
                            {/* LEFT SIDE: info */}
                            <div>
                                <Line>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <StatusBadge $s={status}>{status}</StatusBadge>
                                        {o.source && (
                                            <Tag>{o.source.toUpperCase()}</Tag>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, color: COLORS.subtext }}>
                                        #{o.id.slice(-6)}
                                    </span>
                                </Line>

                                <Line style={{ marginTop: 4 }}>
                                    <Label>Customer</Label>
                                    <Strong>{o.customer?.name || o.customer?.email || "—"}</Strong>
                                </Line>

                                {o.customer?.phone && (
                                    <Line>
                                        <Label>Phone</Label>
                                        <button
                                            onClick={() => callCustomer(o.customer.phone)}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: COLORS.text,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                fontSize: 13,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <FiPhone /> {o.customer.phone}
                                        </button>
                                    </Line>
                                )}

                                {o.shippingAddress && (
                                    <Line>
                                        <Label>
                                            <FiMapPin /> Address
                                        </Label>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                maxWidth: 260,
                                                textAlign: "right",
                                            }}
                                        >
                                            {o.shippingAddress}
                                        </span>
                                    </Line>
                                )}

                                <Line style={{ marginTop: 6 }}>
                                    <div style={{ fontSize: 12, color: COLORS.subtext }}>
                                        {formatDate(o.createdAt)} • {formatTime(o.createdAt)}
                                    </div>
                                    <div style={{ fontSize: 12, color: COLORS.subtext }}>
                                        {totalQty} pcs • {items.length} lines •{" "}
                                        <Strong>{money(o.pricing?.total)}</Strong>
                                    </div>
                                </Line>
                            </div>

                            {/* RIGHT SIDE: actions */}
                            <ActionsCol>
                                <PrimaryBtn
                                    disabled={status === "FULFILLED" || status === "CANCELLED"}
                                    onClick={() =>
                                        updateStatus(
                                            o.id,
                                            status === "NEW" ? "PROCESSING" : "FULFILLED"
                                        )
                                    }
                                >
                                    {status === "NEW" ? (
                                        <>
                                            <FiTruck /> Start Delivery
                                        </>
                                    ) : status === "PROCESSING" ? (
                                        <>
                                            <FiCheckCircle /> Mark Delivered
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle /> Delivered
                                        </>
                                    )}
                                </PrimaryBtn>

                                {status !== "FULFILLED" && status !== "CANCELLED" && (
                                    <SecondaryBtn
                                        onClick={() => {
                                            const reason = window.prompt(
                                                "Reason for cancel / undelivered? (optional)"
                                            );
                                            updateStatus(o.id, "CANCELLED", { cancelReason: reason || null });
                                        }}
                                    >
                                        <FiMinusCircle /> Unable to Deliver
                                    </SecondaryBtn>
                                )}
                            </ActionsCol>
                        </Card>
                    );
                })}
            </List>
        </Page>
    );
}
