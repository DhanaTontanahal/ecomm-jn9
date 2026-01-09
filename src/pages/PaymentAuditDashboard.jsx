// src/pages/PaymentAuditDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { db } from "../firebase/firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    documentId,
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
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  position: relative;
  width: 240px;
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
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  background: ${(p) => (p.$stripe ? TOK.tableStripe : "#fff")};
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
        return d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
    } catch {
        return String(ts);
    }
};

export default function PaymentAuditDashboard() {

    const [productsById, setProductsById] = useState({});
    const [selectedTxIds, setSelectedTxIds] = useState(new Set());


    // ✅ NEW: transactions tab state
    const [transactions, setTransactions] = useState([]);
    const [loadingTx, setLoadingTx] = useState(false);

    // ✅ NEW: transactions filters
    const [txSearch, setTxSearch] = useState("");
    const [txAfter, setTxAfter] = useState(""); // datetime-local



    // NEW: view tab
    const [view, setView] = useState("audit"); // audit | orders_pre

    // Existing: audit state
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterTab, setFilterTab] = useState("all"); // all | ok | mismatch | pending
    const [search, setSearch] = useState("");

    // NEW: orders_pre state
    const [ordersPre, setOrdersPre] = useState([]);
    const [loadingPre, setLoadingPre] = useState(false);
    const [searchPre, setSearchPre] = useState("");

    // NEW: date range filter for orders_pre
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");



    const loadAuditData = async () => {
        setLoading(true);
        try {
            // 1) orders_in_payment_process
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
                pendingById[key] = { docId: doc.id, ...d };
            });

            // 2) order_status_payments
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
                    typeof sd.response_amount !== "undefined" ? sd.response_amount : sd.amount;

                const responseAmount = responseAmountRaw != null ? Number(responseAmountRaw) : null;

                const amountsMatch =
                    initiatedAmount != null &&
                    responseAmount != null &&
                    initiatedAmount === responseAmount;

                const validationOk = sd.validationOk !== false && amountsMatch;

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

                if (orderId && pendingById[orderId]) delete pendingById[orderId];
            });

            // 3) pending-only
            Object.entries(pendingById).forEach(([orderId, pending]) => {
                const initiatedAmount =
                    typeof pending.amount !== "undefined" ? Number(pending.amount) : null;

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

            merged.sort((a, b) => {
                const aDate =
                    a.createdAtStatus?.toMillis?.() || a.createdAtInitiated?.toMillis?.() || 0;
                const bDate =
                    b.createdAtStatus?.toMillis?.() || b.createdAtInitiated?.toMillis?.() || 0;
                return bDate - aDate;
            });

            setRows(merged);
        } catch (err) {
            console.error("PaymentAuditDashboard load error:", err);
            alert("Failed to load payment audit data. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const loadOrdersPre = async () => {
        setLoadingPre(true);
        try {
            const qPre = query(
                collection(db, "orders_pre"),
                orderBy("createdAt", "desc"),
                limit(400)
            );
            const snap = await getDocs(qPre);
            const list = [];
            snap.forEach((doc) => {
                list.push({
                    docId: doc.id, // IMPORTANT: order_pre doc id
                    ...(doc.data() || {}),
                });
            });
            setOrdersPre(list);
        } catch (err) {
            console.error("orders_pre load error:", err);
            alert("Failed to load orders_pre. Check console for details.");
        } finally {
            setLoadingPre(false);
        }
    };


    const loadTransactions = async () => {
        setLoadingTx(true);
        try {
            const qTx = query(
                collection(db, "order_status_payments"),
                orderBy("createdAt", "desc"),
                limit(700)
            );

            const snap = await getDocs(qTx);

            // Count how many times an orderId appears (duplicates / multiple writes)
            const countMap = {};
            const list = [];

            snap.forEach((d) => {
                const x = d.data() || {};
                const orderId = x.orderId || d.id;

                if (orderId) countMap[orderId] = (countMap[orderId] || 0) + 1;

                list.push({
                    docId: d.id,
                    orderId,
                    status: x.orderStatus || x.rawStatus || x.status || "-",
                    amount:
                        typeof x.response_amount !== "undefined"
                            ? Number(x.response_amount)
                            : typeof x.amount !== "undefined"
                                ? Number(x.amount)
                                : null,
                    createdAt: x.createdAt || null,
                    raw: x,
                });
            });

            // Attach orderId count
            const enriched = list.map((t) => ({
                ...t,
                orderIdCount: countMap[t.orderId] || 1,
            }));

            setTransactions(enriched);
        } catch (e) {
            console.error("loadTransactions error:", e);
            alert("Failed to load transactions (order_status_payments).");
        } finally {
            setLoadingTx(false);
        }
    };


    useEffect(() => {
        if (view === "transactions" && transactions.length === 0) {
            loadTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);


    useEffect(() => {
        // load audit by default
        loadAuditData();
    }, []);

    // auto-load orders_pre when switching to it (first time or whenever you want)
    useEffect(() => {
        if (view === "orders_pre" && ordersPre.length === 0) {
            loadOrdersPre();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const filteredRows = useMemo(() => {
        let out = rows;
        if (filterTab === "ok") out = out.filter((r) => r.variant === "ok");
        else if (filterTab === "mismatch") out = out.filter((r) => r.variant === "mismatch");
        else if (filterTab === "pending") out = out.filter((r) => r.variant === "pending");

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            out = out.filter((r) =>
                (r.orderId || "").toLowerCase().includes(q) ||
                (r.customerEmail || "").toLowerCase().includes(q) ||
                (r.customerPhone || "").toLowerCase().includes(q)
            );
        }
        return out;
    }, [rows, filterTab, search]);

    const totals = useMemo(() => {
        const total = rows.length;
        const ok = rows.filter((r) => r.variant === "ok").length;
        const mismatch = rows.filter((r) => r.variant === "mismatch").length;
        const pending = rows.filter((r) => r.variant === "pending").length;
        return { total, ok, mismatch, pending };
    }, [rows]);

    const filteredOrdersPre = useMemo(() => {
        let out = ordersPre;

        // 🔍 text search
        if (searchPre.trim()) {
            const q = searchPre.trim().toLowerCase();
            out = out.filter((r) => {
                return (
                    (r.docId || "").toLowerCase().includes(q) ||
                    (r.lockedOrderId || "").toLowerCase().includes(q) ||
                    (r.customerId || "").toLowerCase().includes(q)
                );
            });
        }

        // 📅 date range filter
        if (fromDate || toDate) {
            const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
            const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

            out = out.filter((r) => {
                const ts =
                    r.createdAt?.toDate?.() ||
                    r.initiatedAt?.toDate?.() ||
                    null;

                if (!ts) return false;

                const time = ts.getTime();
                if (from && time < from) return false;
                if (to && time > to) return false;

                return true;
            });
        }

        return out;
    }, [ordersPre, searchPre, fromDate, toDate]);


    const filteredTransactions = useMemo(() => {
        let out = transactions;

        // 🔎 search by orderId / docId / status
        if (txSearch.trim()) {
            const q = txSearch.trim().toLowerCase();
            out = out.filter((t) => {
                return (
                    (t.orderId || "").toLowerCase().includes(q) ||
                    (t.docId || "").toLowerCase().includes(q) ||
                    (t.status || "").toLowerCase().includes(q)
                );
            });
        }

        // ⏱️ orders after (datetime)
        if (txAfter) {
            const afterMs = new Date(txAfter).getTime();
            out = out.filter((t) => {
                const ts = t.createdAt?.toDate?.() || (t.createdAt ? new Date(t.createdAt) : null);
                if (!ts) return false;
                return ts.getTime() >= afterMs;
            });
        }

        return out;
    }, [transactions, txSearch, txAfter]);


    const toggleTxSelect = (docId) => {
        setSelectedTxIds((prev) => {
            const next = new Set(prev);
            if (next.has(docId)) next.delete(docId);
            else next.add(docId);
            return next;
        });
    };

    const clearTxSelection = () => setSelectedTxIds(new Set());

    // const selectAllFilteredTx = () => {
    //     setSelectedTxIds(new Set(filteredTransactions.map((t) => t.docId)));
    // };


    const selectAllFilteredTx = () => {
        setSelectedTxIds((prev) => {
            const next = new Set(prev);
            filteredTransactions.forEach((t) => next.add(t.docId));
            return next;
        });
    };


    const areAllFilteredSelected =
        filteredTransactions.length > 0 &&
        filteredTransactions.every((t) => selectedTxIds.has(t.docId));

    const selectedTxCount = selectedTxIds.size;

    // const selectedTransactions = useMemo(() => {
    //     if (selectedTxIds.size === 0) return [];
    //     const setRef = selectedTxIds;
    //     return filteredTransactions.filter((t) => setRef.has(t.docId));
    // }, [filteredTransactions, selectedTxIds]);


    const selectedTransactions = useMemo(() => {
        if (selectedTxIds.size === 0) return [];
        const setRef = selectedTxIds;
        // ✅ use ALL transactions, not only filtered ones
        return transactions.filter((t) => setRef.has(t.docId));
    }, [transactions, selectedTxIds]);




    // const filteredOrdersPre = useMemo(() => {
    //     let out = ordersPre;
    //     if (searchPre.trim()) {
    //         const q = searchPre.trim().toLowerCase();
    //         out = out.filter((r) => {
    //             const docId = (r.docId || "").toLowerCase();
    //             const locked = (r.lockedOrderId || "").toLowerCase();
    //             const customerId = (r.customerId || "").toLowerCase();
    //             return docId.includes(q) || locked.includes(q) || customerId.includes(q);
    //         });
    //     }
    //     return out;
    // }, [ordersPre, searchPre]);


    // const renderItemsCompact = (items) => {
    //     if (!Array.isArray(items) || items.length === 0) return <SmallMuted>-</SmallMuted>;

    //     // show up to 3 items, then "+N more"
    //     const preview = items.slice(0, 3);
    //     const more = items.length - preview.length;

    //     return (
    //         <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 340 }}>
    //             {preview.map((it, i) => (
    //                 <Tag key={i} title={JSON.stringify(it, null, 2)}>
    //                     {it?.title || it?.name || it?.productId || "item"} × {it?.qty ?? 1}
    //                     {typeof it?.priceAtPurchase !== "undefined" ? ` (₹${it.priceAtPurchase})` : ""}
    //                 </Tag>
    //             ))}
    //             {more > 0 && <Tag>+{more} more</Tag>}
    //         </div>
    //     );
    // };



    const getProductsTextForOrderId = (orderId) => {
        if (!orderId) return "-";
        const pre = ordersPre.find((x) => x.lockedOrderId === orderId);
        if (!pre || !Array.isArray(pre.items) || pre.items.length === 0) return "-";

        return pre.items
            .map((it) => {
                const p = it?.productId ? productsById[it.productId] : null;
                const name = p?.title || it?.title || it?.productId || "Item";
                const qty = it?.qty ?? 1;
                const type = p?.sizeLabel || p?.category || "";
                return `${name} x${qty}${type ? ` (${type})` : ""}`;
            })
            .join(", ");
    };


    // const exportTransactionsToExcel = () => {
    //     try {
    //         const data = (filteredTransactions || []).map((t, idx) => {
    //             const ts = t.createdAt?.toDate?.() || (t.createdAt ? new Date(t.createdAt) : null);
    //             return {
    //                 "#": idx + 1,
    //                 "Transaction status": t.status || "-",
    //                 "Transaction amounts": t.amount != null ? Number(t.amount) : "",
    //                 "Number of times each order ID is stored in database for each transaction": t.orderIdCount ?? 1,
    //                 "Timestamp of each transaction": ts ? ts.toLocaleString("en-IN") : "",
    //                 "Details of products associated with each order id (Product Name, Product Type etc.)":
    //                     getProductsTextForOrderId(t.orderId),
    //             };
    //         });

    //         const ws = XLSX.utils.json_to_sheet(data);
    //         const wb = XLSX.utils.book_new();
    //         XLSX.utils.book_append_sheet(wb, ws, "transactions");

    //         const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    //         const blob = new Blob([buf], {
    //             type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //         });

    //         const afterLabel = txAfter ? txAfter.replace(/[:]/g, "-") : "all";
    //         saveAs(blob, `transactions_after_${afterLabel}.xlsx`);
    //     } catch (e) {
    //         console.error("exportTransactionsToExcel failed:", e);
    //         alert("Export failed. Check console.");
    //     }
    // };


    const exportTransactionsToExcel = () => {
        try {
            const rowsToExport = selectedTransactions; // ✅ ONLY selected

            if (!rowsToExport.length) {
                alert("Select at least 1 transaction row to export.");
                return;
            }

            const data = rowsToExport.map((t, idx) => {
                const ts = t.createdAt?.toDate?.() || (t.createdAt ? new Date(t.createdAt) : null);
                return {
                    "Order Number": t.orderId || "-", // ✅ first column in excel
                    "Transaction status": t.status || "-",
                    "Transaction amounts": t.amount != null ? Number(t.amount) : "",
                    "Number of times each order ID is stored in database for each transaction": t.orderIdCount ?? 1,
                    "Timestamp of each transaction": ts ? ts.toLocaleString("en-IN") : "",
                    "Details of products associated with each order id (Product Name, Product Type etc.)":
                        getProductsTextForOrderId(t.orderId),
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "transactions");

            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([buf], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const afterLabel = txAfter ? txAfter.replace(/[:]/g, "-") : "all";
            saveAs(blob, `transactions_selected_${rowsToExport.length}_after_${afterLabel}.xlsx`);
        } catch (e) {
            console.error("exportTransactionsToExcel failed:", e);
            alert("Export failed. Check console.");
        }
    };



    const renderItemsWithProductDetails = (items) => {
        if (!Array.isArray(items) || items.length === 0) return <SmallMuted>-</SmallMuted>;

        return (
            <div style={{ display: "grid", gap: 8, minWidth: 320 }}>
                {items.map((it, idx) => {
                    const p = it?.productId ? productsById[it.productId] : null;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                padding: "6px 8px",
                                border: `1px solid ${TOK.border}`,
                                borderRadius: 12,
                                background: "#fff",
                            }}
                        >
                            {/* Image */}
                            <div style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", flex: "0 0 auto", background: TOK.chip }}>
                                {p?.imageUrl ? (
                                    <img
                                        src={p.imageUrl}
                                        alt={p?.title || "product"}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : null}
                            </div>

                            {/* Details */}
                            <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 900, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {p?.title || it?.title || it?.productId || "Unknown product"}
                                </div>

                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <Tag>qty: {it?.qty ?? 1}</Tag>
                                    {p?.sizeLabel && <Tag>{p.sizeLabel}</Tag>}
                                    {p?.sku && <Tag>{p.sku}</Tag>}
                                    {typeof it?.priceAtPurchase !== "undefined" && <Tag>buy: ₹{it.priceAtPurchase}</Tag>}
                                    {typeof p?.price !== "undefined" && <Tag>now: ₹{p.price}</Tag>}
                                    {typeof p?.mrp !== "undefined" && <Tag>mrp: ₹{p.mrp}</Tag>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };


    useEffect(() => {
        if (view !== "orders_pre") return;
        if (!filteredOrdersPre?.length) return;

        const ids = [];
        filteredOrdersPre.forEach((r) => {
            if (Array.isArray(r.items)) {
                r.items.forEach((it) => it?.productId && ids.push(it.productId));
            }
        });

        // only fetch ones we don't have already
        const missing = Array.from(new Set(ids)).filter((id) => !productsById[id]);
        if (missing.length === 0) return;

        (async () => {
            try {
                const fetched = await fetchProductsByIds(missing);
                setProductsById((prev) => ({ ...prev, ...fetched }));
            } catch (e) {
                console.error("Failed to fetch product details:", e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, filteredOrdersPre]);




    const fetchProductsByIds = async (ids = []) => {
        const cleanIds = Array.from(new Set(ids.filter(Boolean)));
        if (cleanIds.length === 0) return {};

        const out = {};
        const chunkSize = 10; // Firestore "in" limit is 10

        for (let i = 0; i < cleanIds.length; i += chunkSize) {
            const chunk = cleanIds.slice(i, i + chunkSize);
            const q = query(collection(db, "products"), where(documentId(), "in", chunk));
            const snap = await getDocs(q);
            snap.forEach((d) => {
                out[d.id] = { id: d.id, ...(d.data() || {}) };
            });
        }

        return out;
    };


    return (
        <Page>
            <Shell>
                <HeadRow>
                    <TitleBlock>
                        <h1>
                            {view === "audit" ? "Payment Integrity Dashboard" : "Orders Pre Dashboard"}
                        </h1>
                        <p>
                            {view === "audit" ? (
                                <>
                                    Admin view to cross-verify <strong>initiatePayment</strong> vs{" "}
                                    <strong>handlePaymentResponse</strong>.
                                </>
                            ) : (
                                <>
                                    View & search <strong>orders_pre</strong> documents. Filter by{" "}
                                    <strong>docId / lockedOrderId</strong>.
                                </>
                            )}
                        </p>
                    </TitleBlock>

                    {view === "audit" ? (
                        <StatRow>
                            <StatCard>
                                <small>Total Orders</small>
                                <strong>{totals.total}</strong>
                            </StatCard>
                            <StatCard>
                                <small>Fully Verified</small>
                                <strong style={{ color: TOK.success }}>{totals.ok}</strong>
                            </StatCard>
                            <StatCard>
                                <small>Action Needed</small>
                                <strong style={{ color: TOK.danger }}>{totals.mismatch}</strong>
                            </StatCard>
                            <StatCard>
                                <small>Pending</small>
                                <strong style={{ color: TOK.warn }}>{totals.pending}</strong>
                            </StatCard>
                        </StatRow>
                    ) : (
                        <StatRow>
                            <StatCard>
                                <small>orders_pre</small>
                                <strong>{ordersPre.length}</strong>
                            </StatCard>
                            <StatCard>
                                <small>Filtered</small>
                                <strong>{filteredOrdersPre.length}</strong>
                            </StatCard>
                        </StatRow>
                    )}
                </HeadRow>

                <Card>
                    <CardHead>
                        {/* NEW: main view tabs */}
                        <Tabs>
                            <Tab $active={view === "audit"} onClick={() => setView("audit")}>
                                Payment Audit
                            </Tab>
                            <Tab $active={view === "orders_pre"} onClick={() => setView("orders_pre")}>
                                Orders Pre
                            </Tab>
                            <Tab $active={view === "transactions"} onClick={() => setView("transactions")}>
                                Transactions
                            </Tab>
                        </Tabs>


                        {view === "audit" ? (
                            <SearchWrap>
                                <LegendRow>
                                    <LegendItem>
                                        <FiCheckCircle color={TOK.success} />
                                        <span>Amounts match & validation OK</span>
                                    </LegendItem>
                                    <LegendItem>
                                        <FiAlertTriangle color={TOK.danger} />
                                        <span>
                                            Amount / signature mismatch – <strong>action needed</strong>
                                        </span>
                                    </LegendItem>
                                    <LegendItem>
                                        <FiXCircle color={TOK.warn} />
                                        <span>Initiated but no gateway response yet</span>
                                    </LegendItem>
                                </LegendRow>

                                <Tabs>
                                    <Tab $active={filterTab === "all"} onClick={() => setFilterTab("all")}>
                                        All
                                    </Tab>
                                    <Tab $active={filterTab === "ok"} onClick={() => setFilterTab("ok")}>
                                        Verified
                                    </Tab>
                                    <Tab $active={filterTab === "mismatch"} onClick={() => setFilterTab("mismatch")}>
                                        Action needed
                                    </Tab>
                                    <Tab $active={filterTab === "pending"} onClick={() => setFilterTab("pending")}>
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

                                <IconBtn type="button" disabled={loading} onClick={loadAuditData}>
                                    <FiRefreshCw />
                                    {loading ? "Refreshing..." : "Refresh"}
                                </IconBtn>
                            </SearchWrap>
                        ) : view === "orders_pre" ? (
                            <SearchWrap>
                                {/* From datetime */}
                                <input
                                    type="datetime-local"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        border: `1px solid ${TOK.border}`,
                                        fontSize: 12,
                                        background: "#f9fafb",
                                    }}
                                />

                                {/* To datetime */}
                                <input
                                    type="datetime-local"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        border: `1px solid ${TOK.border}`,
                                        fontSize: 12,
                                        background: "#f9fafb",
                                    }}
                                />

                                <SearchBox>
                                    <FiSearch />
                                    <input
                                        placeholder="Filter by orderId / lockedOrderId / customerId"
                                        value={searchPre}
                                        onChange={(e) => setSearchPre(e.target.value)}
                                    />
                                </SearchBox>

                                <IconBtn type="button" disabled={loadingPre} onClick={loadOrdersPre}>
                                    <FiRefreshCw />
                                    {loadingPre ? "Refreshing..." : "Refresh"}
                                </IconBtn>
                            </SearchWrap>
                        ) : (
                            <SearchWrap>
                                {/* Orders after datetime */}
                                <input
                                    type="datetime-local"
                                    value={txAfter}
                                    onChange={(e) => setTxAfter(e.target.value)}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        border: `1px solid ${TOK.border}`,
                                        fontSize: 12,
                                        background: "#f9fafb",
                                    }}
                                />

                                <SearchBox>
                                    <FiSearch />
                                    <input
                                        placeholder="Search orderId / status / docId"
                                        value={txSearch}
                                        onChange={(e) => setTxSearch(e.target.value)}
                                    />
                                </SearchBox>

                                <IconBtn type="button" disabled={loadingTx} onClick={loadTransactions}>
                                    <FiRefreshCw />
                                    {loadingTx ? "Refreshing..." : "Refresh"}
                                </IconBtn>

                                <IconBtn
                                    type="button"
                                    disabled={filteredTransactions.length === 0}
                                    onClick={areAllFilteredSelected ? clearTxSelection : selectAllFilteredTx}
                                >
                                    {areAllFilteredSelected ? "Clear All" : "Select All"}
                                </IconBtn>

                                <Tag>Selected: {selectedTxCount}</Tag>

                                <IconBtn
                                    type="button"
                                    disabled={selectedTxCount === 0}
                                    onClick={exportTransactionsToExcel}
                                >
                                    ⬇ Export Excel
                                </IconBtn>

                            </SearchWrap>
                        )}

                    </CardHead>
                    <TableWrap>
                        {view === "audit" ? (
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
                                                <SmallMuted>No records to display. Try clearing filters or refresh.</SmallMuted>
                                            </Td>
                                        </Tr>
                                    )}

                                    {filteredRows.map((row, idx) => (
                                        <Tr key={row.orderId + idx} $stripe={idx % 2 === 1}>
                                            <Td>
                                                <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.2 }}>
                                                    {row.orderId}
                                                </div>
                                                <SmallMuted>{row.customerId ? `customer: ${row.customerId}` : "-"}</SmallMuted>
                                            </Td>
                                            <Td>
                                                {row.initiatedAmount != null ? `₹${row.initiatedAmount.toFixed(2)}` : (
                                                    <SmallMuted>Not captured</SmallMuted>
                                                )}
                                            </Td>
                                            <Td>
                                                {row.responseAmount != null ? `₹${row.responseAmount.toFixed(2)}` : (
                                                    <SmallMuted>—</SmallMuted>
                                                )}
                                            </Td>
                                            <Td><Tag>{row.gatewayStatus}</Tag></Td>
                                            <Td>
                                                <StatusPill $variant={row.variant}>
                                                    {row.variant === "ok" && (<><FiCheckCircle /><span>OK</span></>)}
                                                    {row.variant === "mismatch" && (<><FiAlertTriangle /><span>Action needed</span></>)}
                                                    {row.variant === "pending" && (<><FiXCircle /><span>Pending</span></>)}
                                                </StatusPill>
                                            </Td>
                                            <Td>
                                                {row.customerEmail && <div>{row.customerEmail}</div>}
                                                {row.customerPhone && <SmallMuted>{row.customerPhone}</SmallMuted>}
                                                {!row.customerEmail && !row.customerPhone && <SmallMuted>-</SmallMuted>}
                                            </Td>
                                            <Td>
                                                <SmallMuted>Initiated: {formatTs(row.createdAtInitiated)}</SmallMuted>
                                                <SmallMuted>Status: {formatTs(row.createdAtStatus)}</SmallMuted>
                                            </Td>
                                            <Td>
                                                {row.validationErrors?.length ? (
                                                    <SmallMuted>{row.validationErrors.join(" • ")}</SmallMuted>
                                                ) : row.variant === "ok" ? (
                                                    <SmallMuted>Amounts & signature OK</SmallMuted>
                                                ) : row.variant === "pending" ? (
                                                    <SmallMuted>Awaiting callback / status update</SmallMuted>
                                                ) : (
                                                    <SmallMuted>-</SmallMuted>
                                                )}
                                            </Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : view === "orders_pre" ? (
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Order Pre ID (docId)</Th>
                                        <Th>Locked Order ID</Th>
                                        <Th>Status</Th>
                                        <Th>Customer</Th>
                                        <Th>Total</Th>
                                        <Th>Items</Th>
                                        <Th>Items (details)</Th>
                                        <Th>Initiated</Th>
                                        <Th>Expires</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrdersPre.length === 0 && !loadingPre && (
                                        <Tr>
                                            <Td colSpan={9}>
                                                <SmallMuted>No orders_pre records. Try another Order ID or refresh.</SmallMuted>
                                            </Td>
                                        </Tr>
                                    )}

                                    {filteredOrdersPre.map((r, idx) => (
                                        <Tr key={r.docId} $stripe={idx % 2 === 1}>
                                            <Td><div style={{ fontWeight: 900 }}>{r.docId}</div></Td>
                                            <Td>{r.lockedOrderId ? <Tag>{r.lockedOrderId}</Tag> : <SmallMuted>-</SmallMuted>}</Td>
                                            <Td>{r.status ? <Tag>{r.status}</Tag> : <SmallMuted>-</SmallMuted>}</Td>
                                            <Td>
                                                <div style={{ fontWeight: 800 }}>{r.customerId || "-"}</div>
                                                <SmallMuted>{r.deliveryAddressId ? `addr: ${r.deliveryAddressId}` : "addr: -"}</SmallMuted>
                                            </Td>
                                            <Td>
                                                {typeof r.computedTotal !== "undefined"
                                                    ? `₹${Number(r.computedTotal).toFixed(2)}`
                                                    : <SmallMuted>-</SmallMuted>}
                                            </Td>
                                            <Td><Tag>{Array.isArray(r.items) ? r.items.length : 0}</Tag></Td>
                                            <Td>{renderItemsWithProductDetails(r.items)}</Td>
                                            <Td><SmallMuted>{formatTs(r.initiatedAt)}</SmallMuted></Td>
                                            <Td><SmallMuted>{formatTs(r.expiresAt)}</SmallMuted></Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <Table>
                                <thead>
                                    <tr>
                                        <Th style={{ width: 42 }}>
                                            <input
                                                type="checkbox"
                                                checked={areAllFilteredSelected}
                                                onChange={() => (areAllFilteredSelected ? clearTxSelection() : selectAllFilteredTx())}
                                            />
                                        </Th>
                                        <Th>Order Number</Th>
                                        <Th>Transaction status</Th>
                                        <Th>Transaction amounts</Th>
                                        <Th>Number of times each order ID is stored in database for each transaction</Th>
                                        <Th>Timestamp of each transaction</Th>
                                        <Th>Details of products associated with each order id (Product Name, Product Type etc.)</Th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredTransactions.length === 0 && !loadingTx && (
                                        <Tr>
                                            <Td colSpan={6}>
                                                <SmallMuted>No transactions found. Change filter or refresh.</SmallMuted>
                                            </Td>
                                        </Tr>
                                    )}

                                    {filteredTransactions.map((t, idx) => {
                                        const ts = t.createdAt?.toDate?.() || (t.createdAt ? new Date(t.createdAt) : null);
                                        const checked = selectedTxIds.has(t.docId);

                                        return (
                                            <Tr key={t.docId || `${t.orderId}-${idx}`} $stripe={idx % 2 === 1}>
                                                {/* checkbox */}
                                                <Td>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleTxSelect(t.docId)}
                                                    />
                                                </Td>

                                                {/* ✅ first column: order number */}
                                                <Td>
                                                    <div style={{ fontWeight: 900 }}>{t.orderId || "-"}</div>
                                                    <SmallMuted>doc: {t.docId}</SmallMuted>
                                                </Td>

                                                <Td><Tag>{t.status || "-"}</Tag></Td>
                                                <Td>{t.amount != null ? `₹${Number(t.amount).toFixed(2)}` : "-"}</Td>
                                                <Td><Tag>{t.orderIdCount ?? 1}</Tag></Td>
                                                <Td><SmallMuted>{ts ? ts.toLocaleString("en-IN") : "-"}</SmallMuted></Td>
                                                <Td>
                                                    <SmallMuted style={{ maxWidth: 520, whiteSpace: "normal" }}>
                                                        {getProductsTextForOrderId(t.orderId)}
                                                    </SmallMuted>
                                                </Td>
                                            </Tr>
                                        );
                                    })}

                                </tbody>
                            </Table>
                        )}
                    </TableWrap>


                </Card>
            </Shell>
        </Page>
    );
}
