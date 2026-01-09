// src/pages/PaymentAuditDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { db } from "../firebase/firebase";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
} from "firebase/firestore";
import {
    FiAlertTriangle,
    FiCheckCircle,
    FiRefreshCw,
    FiSearch,
    FiXCircle,
} from "react-icons/fi";

/* ===== tokens (admin-ish) ===== */
const TOK = {
    bg: "#f3f4f6",
    card: "#ffffff",
    border: "rgba(15,23,42,0.08)",
    ink: "#111827",
    sub: "#6b7280",
    mut: "#9ca3af",
    accent: "#0f766e", // teal
    accentSoft: "rgba(15,118,110,0.08)",
    danger: "#dc2626",
    dangerSoft: "rgba(220,38,38,0.08)",
    warn: "#d97706",
    warnSoft: "rgba(217,119,6,0.08)",
    success: "#16a34a",
    successSoft: "rgba(22,163,74,0.1)",
    chip: "rgba(15,23,42,0.04)",
    pill: "rgba(255,255,255,0.8)",
    tableStripe: "#f9fafb",
};

const rise = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}`;

/* ===== layout ===== */
const Page = styled.div`
  min-height: 100dvh;
  background: ${TOK.bg};
  color: ${TOK.ink};
  padding: 16px 12px 24px;
`;

const Shell = styled.div`
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
`;

const HeadRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 4px;
  h1 {
    margin: 0;
    font-size: clamp(22px, 3.1vw, 26px);
    letter-spacing: 0.2px;
  }
  p {
    margin: 0;
    color: ${TOK.sub};
    font-size: 13px;
    max-width: 560px;
  }
`;

const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StatCard = styled.div`
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 12px;
  background: ${TOK.card};
  border: 1px solid ${TOK.border};
  display: grid;
  gap: 3px;
  small {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${TOK.sub};
    font-weight: 700;
  }
  strong {
    font-size: 16px;
  }
`;

const Card = styled.div`
  background: ${TOK.card};
  border-radius: 18px;
  border: 1px solid ${TOK.border};
  padding: 12px 12px 14px;
  animation: ${rise} 0.25s ease;
  display: grid;
  gap: 10px;
`;

const CardHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
`;

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: ${TOK.sub};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: ${TOK.chip};
  svg {
    width: 14px;
    height: 14px;
  }
`;

const SearchWrap = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  width: 220px;
  max-width: 100%;
  input {
    width: 100%;
    border-radius: 999px;
    border: 1px solid ${TOK.border};
    padding: 7px 28px 7px 28px;
    font-size: 13px;
    outline: none;
    background: #f9fafb;
  }
  svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    color: ${TOK.mut};
  }
`;

const IconBtn = styled.button`
  border: 0;
  background: ${TOK.pill};
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  color: ${TOK.ink};
  cursor: pointer;
  svg {
    width: 14px;
    height: 14px;
  }
  &:active {
    transform: translateY(1px);
    opacity: 0.8;
  }
`;

const Tabs = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: ${TOK.chip};
  gap: 3px;
`;

const Tab = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#0f172a" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : TOK.sub)};
`;

/* ===== table ===== */
const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid ${TOK.border};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 840px;
  font-size: 12px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid ${TOK.border};
  background: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${TOK.sub};
  font-weight: 800;
  white-space: nowrap;
`;

const Tr = styled.tr`
  background: ${(p) =>
        p.$stripe ? TOK.tableStripe : "#fff"};
`;

const Td = styled.td`
  padding: 8px 10px;
  border-top: 1px solid rgba(15, 23, 42, 0.04);
  vertical-align: top;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  color: ${(p) =>
        p.$variant === "ok"
            ? TOK.success
            : p.$variant === "mismatch"
                ? TOK.danger
                : TOK.warn};
  background: ${(p) =>
        p.$variant === "ok"
            ? TOK.successSoft
            : p.$variant === "mismatch"
                ? TOK.dangerSoft
                : TOK.warnSoft};
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: ${TOK.sub};
  background: ${TOK.chip};
`;

const SmallMuted = styled.div`
  font-size: 11px;
  color: ${TOK.sub};
`;

/* ===== helper: format ts ===== */
const formatTs = (ts) => {
    if (!ts) return "-";
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString("en-IN", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return String(ts);
    }
};

/**
 * This dashboard lets admin verify:
 * - What amount & orderId we initiated at /initiatePayment (client side)
 * - What amount & status gateway returned at /handlePaymentResponse
 * It is the “single source of truth” to catch tampering or bugs.
 */
export default function PaymentAuditDashboard() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterTab, setFilterTab] = useState("all"); // all | ok | mismatch | pending
    const [search, setSearch] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            // 1) Load orders_in_payment_process (initiatePayment)
            const qPending = query(
                collection(db, "orders_in_payment_process"),
                orderBy("createdAt", "desc"),
                limit(300)
            );
            const pendingSnap = await getDocs(qPending);
            const pendingById = {};
            pendingSnap.forEach((doc) => {
                const d = doc.data() || {};
                const key = d.orderId || doc.id;
                if (!key) return;
                pendingById[key] = {
                    docId: doc.id,
                    ...d,
                };
            });

            // 2) Load order_status_payments (handlePaymentResponse)
            const qStatus = query(
                collection(db, "order_status_payments"),
                orderBy("createdAt", "desc"),
                limit(300)
            );
            const statusSnap = await getDocs(qStatus);

            const merged = [];

            statusSnap.forEach((doc) => {
                const sd = doc.data() || {};
                const orderId = sd.orderId || doc.id;
                const pending = pendingById[orderId] || null;

                const initiatedAmount =
                    pending && typeof pending.amount !== "undefined"
                        ? Number(pending.amount)
                        : null;
                const responseAmountRaw =
                    typeof sd.response_amount !== "undefined"
                        ? sd.response_amount
                        : sd.amount;
                const responseAmount =
                    responseAmountRaw != null ? Number(responseAmountRaw) : null;

                const amountsMatch =
                    initiatedAmount != null &&
                    responseAmount != null &&
                    initiatedAmount === responseAmount;

                // we already store validationOk in backend, but also check amounts
                const validationOk =
                    sd.validationOk !== false && amountsMatch;

                const hasMismatch =
                    !validationOk ||
                    !amountsMatch ||
                    sd.orderStatus === "AUTHORIZATION_FAILED" ||
                    sd.orderStatus === "AUTHENTICATION_FAILED";

                let variant = "pending";
                if (hasMismatch) variant = "mismatch";
                else if (validationOk) variant = "ok";

                merged.push({
                    orderId,
                    initiatedAmount,
                    responseAmount,
                    customerId: pending?.customerId || sd.customerId,
                    customerEmail: pending?.customerEmail || sd.customerEmail,
                    customerPhone: pending?.customerPhone || sd.customerPhone,
                    gatewayStatus: sd.orderStatus || sd.rawStatus || "-",
                    validationOk: !!validationOk,
                    validationErrors: sd.validationErrors || [],
                    createdAtStatus: sd.createdAt,
                    createdAtInitiated: pending?.createdAt,
                    variant,
                    raw: sd,
                });

                // remove from pending map so we can later add "pending-only" rows
                if (orderId && pendingById[orderId]) {
                    delete pendingById[orderId];
                }
            });

            // 3) Pending-only orders (initiated but no gateway response yet)
            Object.entries(pendingById).forEach(([orderId, pending]) => {
                const initiatedAmount =
                    typeof pending.amount !== "undefined"
                        ? Number(pending.amount)
                        : null;
                merged.push({
                    orderId,
                    initiatedAmount,
                    responseAmount: null,
                    customerId: pending.customerId,
                    customerEmail: pending.customerEmail,
                    customerPhone: pending.customerPhone,
                    gatewayStatus: "PENDING",
                    validationOk: false,
                    validationErrors: ["No gateway response saved yet"],
                    createdAtStatus: null,
                    createdAtInitiated: pending.createdAt,
                    variant: "pending",
                    raw: {},
                });
            });

            // sort latest first by statusCreatedAt or initiatedCreatedAt
            merged.sort((a, b) => {
                const aDate =
                    (a.createdAtStatus?.toMillis?.() ||
                        a.createdAtInitiated?.toMillis?.() ||
                        0);
                const bDate =
                    (b.createdAtStatus?.toMillis?.() ||
                        b.createdAtInitiated?.toMillis?.() ||
                        0);
                return bDate - aDate;
            });

            setRows(merged);
        } catch (err) {
            console.error("PaymentAuditDashboard load error:", err);
            alert(
                "Failed to load payment audit data. Check console for details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredRows = useMemo(() => {
        let out = rows;
        if (filterTab === "ok") {
            out = out.filter((r) => r.variant === "ok");
        } else if (filterTab === "mismatch") {
            out = out.filter((r) => r.variant === "mismatch");
        } else if (filterTab === "pending") {
            out = out.filter((r) => r.variant === "pending");
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            out = out.filter((r) => {
                return (
                    (r.orderId || "").toLowerCase().includes(q) ||
                    (r.customerEmail || "").toLowerCase().includes(q) ||
                    (r.customerPhone || "").toLowerCase().includes(q)
                );
            });
        }
        return out;
    }, [rows, filterTab, search]);

    const totals = useMemo(() => {
        const total = rows.length;
        const ok = rows.filter((r) => r.variant === "ok").length;
        const mismatch = rows.filter(
            (r) => r.variant === "mismatch"
        ).length;
        const pending = rows.filter(
            (r) => r.variant === "pending"
        ).length;
        return { total, ok, mismatch, pending };
    }, [rows]);

    return (
        <Page>
            <Shell>
                <HeadRow>
                    <TitleBlock>
                        <h1>Payment Integrity Dashboard</h1>
                        <p>
                            Admin view to cross-verify{" "}
                            <strong>initiatePayment</strong> vs{" "}
                            <strong>handlePaymentResponse</strong>. This helps detect
                            any tampering or mismatch between the amount we send to
                            the gateway and the amount we receive back.
                        </p>
                    </TitleBlock>

                    <StatRow>
                        <StatCard>
                            <small>Total Orders</small>
                            <strong>{totals.total}</strong>
                        </StatCard>
                        <StatCard>
                            <small>Fully Verified</small>
                            <strong style={{ color: TOK.success }}>
                                {totals.ok}
                            </strong>
                        </StatCard>
                        <StatCard>
                            <small>Action Needed</small>
                            <strong style={{ color: TOK.danger }}>
                                {totals.mismatch}
                            </strong>
                        </StatCard>
                        <StatCard>
                            <small>Pending</small>
                            <strong style={{ color: TOK.warn }}>
                                {totals.pending}
                            </strong>
                        </StatCard>
                    </StatRow>
                </HeadRow>

                <Card>
                    <CardHead>
                        <LegendRow>
                            <LegendItem>
                                <FiCheckCircle color={TOK.success} />
                                <span>Amounts match & validation OK</span>
                            </LegendItem>
                            <LegendItem>
                                <FiAlertTriangle color={TOK.danger} />
                                <span>
                                    Amount / signature mismatch –{" "}
                                    <strong>action needed</strong>
                                </span>
                            </LegendItem>
                            <LegendItem>
                                <FiXCircle color={TOK.warn} />
                                <span>Initiated but no gateway response yet</span>
                            </LegendItem>
                        </LegendRow>

                        <SearchWrap>
                            <Tabs>
                                <Tab
                                    $active={filterTab === "all"}
                                    onClick={() => setFilterTab("all")}
                                >
                                    All
                                </Tab>
                                <Tab
                                    $active={filterTab === "ok"}
                                    onClick={() => setFilterTab("ok")}
                                >
                                    Verified
                                </Tab>
                                <Tab
                                    $active={filterTab === "mismatch"}
                                    onClick={() => setFilterTab("mismatch")}
                                >
                                    Action needed
                                </Tab>
                                <Tab
                                    $active={filterTab === "pending"}
                                    onClick={() => setFilterTab("pending")}
                                >
                                    Pending
                                </Tab>
                            </Tabs>

                            <SearchBox>
                                <FiSearch />
                                <input
                                    placeholder="Search order / email / phone"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </SearchBox>

                            <IconBtn
                                type="button"
                                disabled={loading}
                                onClick={loadData}
                            >
                                <FiRefreshCw />
                                {loading ? "Refreshing..." : "Refresh"}
                            </IconBtn>
                        </SearchWrap>
                    </CardHead>

                    <TableWrap>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Order ID</Th>
                                    <Th>Initiated (₹)</Th>
                                    <Th>Gateway Response (₹)</Th>
                                    <Th>Gateway Status</Th>
                                    <Th>Integrity</Th>
                                    <Th>Customer</Th>
                                    <Th>Timestamps</Th>
                                    <Th>Notes</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 && !loading && (
                                    <Tr>
                                        <Td colSpan={8}>
                                            <SmallMuted>
                                                No records to display. Try clearing filters or
                                                refresh.
                                            </SmallMuted>
                                        </Td>
                                    </Tr>
                                )}

                                {filteredRows.map((row, idx) => (
                                    <Tr key={row.orderId + idx} $stripe={idx % 2 === 1}>
                                        <Td>
                                            <div
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 12,
                                                    letterSpacing: 0.2,
                                                }}
                                            >
                                                {row.orderId}
                                            </div>
                                            <SmallMuted>
                                                {row.customerId && (
                                                    <span>customer: {row.customerId}</span>
                                                )}
                                            </SmallMuted>
                                        </Td>
                                        <Td>
                                            {row.initiatedAmount != null ? (
                                                <span>₹{row.initiatedAmount.toFixed(2)}</span>
                                            ) : (
                                                <SmallMuted>Not captured</SmallMuted>
                                            )}
                                        </Td>
                                        <Td>
                                            {row.responseAmount != null ? (
                                                <span>₹{row.responseAmount.toFixed(2)}</span>
                                            ) : (
                                                <SmallMuted>—</SmallMuted>
                                            )}
                                        </Td>
                                        <Td>
                                            <Tag>{row.gatewayStatus}</Tag>
                                        </Td>
                                        <Td>
                                            <StatusPill $variant={row.variant}>
                                                {row.variant === "ok" && (
                                                    <>
                                                        <FiCheckCircle />
                                                        <span>OK</span>
                                                    </>
                                                )}
                                                {row.variant === "mismatch" && (
                                                    <>
                                                        <FiAlertTriangle />
                                                        <span>Action needed</span>
                                                    </>
                                                )}
                                                {row.variant === "pending" && (
                                                    <>
                                                        <FiXCircle />
                                                        <span>Pending</span>
                                                    </>
                                                )}
                                            </StatusPill>
                                        </Td>
                                        <Td>
                                            {row.customerEmail && (
                                                <div>{row.customerEmail}</div>
                                            )}
                                            {row.customerPhone && (
                                                <SmallMuted>{row.customerPhone}</SmallMuted>
                                            )}
                                            {!row.customerEmail && !row.customerPhone && (
                                                <SmallMuted>-</SmallMuted>
                                            )}
                                        </Td>
                                        <Td>
                                            <SmallMuted>
                                                Initiated:{" "}
                                                {formatTs(row.createdAtInitiated)}
                                            </SmallMuted>
                                            <SmallMuted>
                                                Status: {formatTs(row.createdAtStatus)}
                                            </SmallMuted>
                                        </Td>
                                        <Td>
                                            {row.validationErrors &&
                                                row.validationErrors.length > 0 ? (
                                                <SmallMuted>
                                                    {row.validationErrors.join(" • ")}
                                                </SmallMuted>
                                            ) : row.variant === "ok" ? (
                                                <SmallMuted>Amounts & signature OK</SmallMuted>
                                            ) : row.variant === "pending" ? (
                                                <SmallMuted>
                                                    Awaiting callback / status update
                                                </SmallMuted>
                                            ) : (
                                                <SmallMuted>-</SmallMuted>
                                            )}
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </TableWrap>
                </Card>
            </Shell>
        </Page>
    );
}
