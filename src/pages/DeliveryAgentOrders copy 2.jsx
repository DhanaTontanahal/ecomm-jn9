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
    getDocs,
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

/* ===== Login Modal ===== */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.85);
  display: ${(p) => (p.$open ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalCard = styled.div`
  width: min(420px, 90vw);
  background: #020617;
  border-radius: 16px;
  border: 1px solid ${COLORS.glassBorder};
  padding: 18px 18px 16px;
  box-shadow: 0 18px 60px rgba(0,0,0,.8);
`;

const ModalTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
`;

const ModalSub = styled.p`
  margin: 0 0 12px;
  font-size: 12px;
  color: ${COLORS.subtext};
`;

const ModalRow = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
`;

const ModalLabel = styled.label`
  font-size: 12px;
  color: ${COLORS.subtext};
`;

const ModalInput = styled.input`
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glassHeader};
  padding: 9px 10px;
  color: ${COLORS.text};
  font-size: 14px;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${COLORS.ring};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
`;

const ModalButton = styled.button`
  border-radius: 999px;
  border: none;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${(p) => (p.$secondary ? "transparent" : COLORS.primary)};
  color: ${(p) => (p.$secondary ? COLORS.subtext : "#fff")};
`;

const ErrorText = styled.div`
  font-size: 12px;
  color: #fecaca;
  margin-top: 4px;
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

// =====================================================
// DeliveryAgentOrders (with phone + passkey login modal)
// =====================================================
export default function DeliveryAgentOrders() {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [tab, setTab] = useState("PENDING"); // PENDING | TODAY | COMPLETED

    // login state
    const [loginPhone, setLoginPhone] = useState("");
    const [loginPasskey, setLoginPasskey] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [deliveryBoy, setDeliveryBoy] = useState(null); // { id, name, phone }

    // ---- live query for this rider ----
    // useEffect(() => {
    //     if (!deliveryBoy?.id) {
    //         setOrders([]);
    //         setLoadingOrders(false);
    //         return;
    //     }

    //     setLoadingOrders(true);

    //     // const qRef = query(
    //     //     collection(db, "orders"),
    //     //     where("deliveryAssignee.id", "==", deliveryBoy.id),
    //     //     orderBy("createdAt", "desc"),
    //     //     limit(200)
    //     // );

    //     const qRef = query(
    //         collection(db, "orders"),
    //         where("deliveryAssignee.phone", "==", deliveryBoy.phone),
    //         orderBy("createdAt", "desc"),
    //         limit(200)
    //     );


    //     const unsub = onSnapshot(
    //         qRef,
    //         (snap) => {
    //             const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    //             setOrders(list);
    //             setLoadingOrders(false);
    //         },
    //         (err) => {
    //             console.error("DeliveryAgentOrders snapshot error", err);
    //             setLoadingOrders(false);
    //         }
    //     );

    //     return () => unsub();
    // }, [deliveryBoy?.id]);


    useEffect(() => {
        if (!deliveryBoy?.id) {
            setOrders([]);
            setLoadingOrders(false);
            return;
        }

        setLoadingOrders(true);

        const qRef = query(
            collection(db, "orders"),
            // 🔴 OLD: where("deliveryAssignee.id", "==", deliveryBoy.id),
            // ✅ NEW: match on phone
            where("deliveryAssignee.phone", "==", deliveryBoy.phone),
            orderBy("createdAt", "desc"),
            limit(200)
        );

        const unsub = onSnapshot(
            qRef,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                console.log(list)
                setOrders(list);
                setLoadingOrders(false);
            },
            (err) => {
                console.error("DeliveryAgentOrders snapshot error", err);
                setLoadingOrders(false);
            }
        );

        return () => unsub();
    }, [deliveryBoy?.id, deliveryBoy?.phone]);


    const filtered = useMemo(() => {
        let arr = [...orders];
        if (tab === "PENDING") {
            arr = arr.filter(
                (o) =>
                    (o.status || "NEW") !== "FULFILLED" &&
                    (o.status || "NEW") !== "CANCELLED"
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
            (o) =>
                (o.status || "NEW") !== "FULFILLED" &&
                (o.status || "NEW") !== "CANCELLED"
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
            ...(nextStatus === "FULFILLED"
                ? { fulfilledAt: serverTimestamp() }
                : {}),
            ...(nextStatus === "CANCELLED"
                ? { cancelledAt: serverTimestamp() }
                : {}),
        };

        await updateDoc(ref, patch);

        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    }

    function callCustomer(phone) {
        if (!phone) return;
        window.location.href = `tel:${phone}`;
    }

    // ---- login handler ----
    async function handleLogin(e) {
        e?.preventDefault?.();
        setLoginError("");

        const phone = loginPhone.trim();
        const passkey = loginPasskey.trim();

        if (!phone || !passkey) {
            setLoginError("Enter phone and passkey.");
            return;
        }

        setLoginLoading(true);
        try {
            const qs = await getDocs(
                query(
                    collection(db, "deliveryBoys"),
                    where("phone", "==", phone),
                    where("isActive", "==", true),
                    limit(5)
                )
            );

            if (qs.empty) {
                setLoginError("No active delivery agent found with this phone.");
                return;
            }

            let match = null;
            qs.forEach((d) => {
                const data = d.data() || {};
                if (String(data.passkey || "") === passkey) {
                    match = { id: d.id, ...data };
                }
            });

            if (!match) {
                setLoginError("Incorrect passkey for this phone.");
                return;
            }

            setDeliveryBoy({
                id: match.id,
                name: match.name || "Delivery Agent",
                phone: match.phone || phone,
            });
        } catch (err) {
            console.error("login error", err);
            setLoginError("Login failed. Please try again.");
        } finally {
            setLoginLoading(false);
        }
    }

    function handleLogout() {
        setDeliveryBoy(null);
        setOrders([]);
        setLoginPhone("");
        setLoginPasskey("");
    }

    return (
        <>
            <Page>
                <Head>
                    <TitleBlock>
                        <h2>My Deliveries</h2>
                        <p>
                            {deliveryBoy?.name
                                ? `Signed in as ${deliveryBoy.name} (${deliveryBoy.phone}).`
                                : "Sign in with your phone & passkey to see assigned orders."}{" "}
                            {deliveryBoy && (
                                <>
                                    Pending: <strong>{stats.pending}</strong> • Completed today:{" "}
                                    <strong>{stats.completedToday}</strong>
                                </>
                            )}
                        </p>
                    </TitleBlock>

                    <ActionsRow>
                        {deliveryBoy && (
                            <SmallBtn onClick={handleLogout}>Logout</SmallBtn>
                        )}
                        <FilterTabs>
                            <TabBtn
                                $active={tab === "PENDING"}
                                onClick={() => setTab("PENDING")}
                            >
                                Pending
                            </TabBtn>
                            <TabBtn
                                $active={tab === "TODAY"}
                                onClick={() => setTab("TODAY")}
                            >
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

                {deliveryBoy && loadingOrders && (
                    <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 8 }}>
                        Loading your assigned orders…
                    </div>
                )}

                {deliveryBoy && !loadingOrders && filtered.length === 0 && (
                    <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 8 }}>
                        No orders in this view. Try switching to another tab.
                    </div>
                )}

                {deliveryBoy && (
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
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <StatusBadge $s={status}>{status}</StatusBadge>
                                                {o.source && <Tag>{o.source.toUpperCase()}</Tag>}
                                            </div>
                                            <span
                                                style={{ fontSize: 11, color: COLORS.subtext }}
                                            >
                                                #{o.id.slice(-6)}
                                            </span>
                                        </Line>

                                        <Line style={{ marginTop: 4 }}>
                                            <Label>Customer</Label>
                                            <Strong>
                                                {o.customer?.name || o.customer?.email || "—"}
                                            </Strong>
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
                                            <div
                                                style={{ fontSize: 12, color: COLORS.subtext }}
                                            >
                                                {formatDate(o.createdAt)} •{" "}
                                                {formatTime(o.createdAt)}
                                            </div>
                                            <div
                                                style={{ fontSize: 12, color: COLORS.subtext }}
                                            >
                                                {totalQty} pcs • {items.length} lines •{" "}
                                                <Strong>{money(o.pricing?.total)}</Strong>
                                            </div>
                                        </Line>
                                    </div>

                                    {/* RIGHT SIDE: actions */}
                                    <ActionsCol>
                                        <PrimaryBtn
                                            disabled={
                                                status === "FULFILLED" || status === "CANCELLED"
                                            }
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
                                                    updateStatus(o.id, "CANCELLED", {
                                                        cancelReason: reason || null,
                                                    });
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
                )}
            </Page>

            {/* Login modal (phone + passkey) */}
            <Backdrop $open={!deliveryBoy}>
                <ModalCard>
                    <ModalTitle>Delivery Agent Login</ModalTitle>
                    <ModalSub>
                        Enter your registered phone number & passkey to view your assigned
                        deliveries.
                    </ModalSub>

                    <form onSubmit={handleLogin}>
                        <ModalRow>
                            <div>
                                <ModalLabel>Phone number</ModalLabel>
                                <ModalInput
                                    placeholder="e.g. 9876543210"
                                    value={loginPhone}
                                    onChange={(e) => setLoginPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <ModalLabel>Passkey</ModalLabel>
                                <ModalInput
                                    type="password"
                                    placeholder="Your secret passkey"
                                    value={loginPasskey}
                                    onChange={(e) => setLoginPasskey(e.target.value)}
                                />
                            </div>
                        </ModalRow>

                        {loginError && <ErrorText>{loginError}</ErrorText>}

                        <ModalActions>
                            <ModalButton
                                type="submit"
                                disabled={loginLoading}
                            >
                                {loginLoading ? "Signing in..." : "Sign In"}
                            </ModalButton>
                        </ModalActions>
                    </form>
                </ModalCard>
            </Backdrop>
        </>
    );
}
