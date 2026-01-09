// src/pages/JournalViewer.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase/firebase";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import RunEodButton from "../components/RunEodButton";

/* ===== tokens (match COA dark theme) ===== */
const TOK = {
    bg: "#020617",
    panel: "rgba(15,23,42,0.96)",
    border: "rgba(148,163,184,0.35)",
    text: "#e5e7eb",
    sub: "#9ca3af",
    accent: "#4ade80",
    accentSoft: "rgba(74,222,128,0.12)",
    danger: "#f97373",
};

const Page = styled.div`
  max-width: 1260px;
  margin: 20px auto;
  padding: 16px;
  color: ${TOK.text};
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Hint = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${TOK.sub};
`;

const Filters = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const DateInput = styled.input`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 7px 10px;
  background: rgba(15, 23, 42, 0.9);
  color: ${TOK.text};
  font-size: 13px;
`;

const RefreshBtn = styled.button`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 7px 14px;
  background: ${TOK.accentSoft};
  color: ${TOK.accent};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1.1fr;
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${TOK.panel};
  border-radius: 12px;
  border: 1px solid ${TOK.border};
  padding: 12px;
  max-height: calc(100vh - 200px);
  overflow: auto;
`;

/* ===== Entries list ===== */
const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const EntriesMeta = styled.div`
  font-size: 12px;
  color: ${TOK.sub};
  margin-bottom: 10px;
`;

const EntryCard = styled.div`
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.9);
  background: rgba(15, 23, 42, 0.7);
  padding: 10px;
  margin-bottom: 10px;
`;

const EntryHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
`;

const Chip = styled.span`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 2px 8px;
  font-size: 11px;
  color: ${TOK.sub};
`;

const Narration = styled.div`
  font-size: 13px;
  margin-bottom: 6px;
`;

const LinesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 4px;
`;

const Th = styled.th`
  text-align: left;
  padding: 4px 4px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.9);
  color: ${TOK.sub};
  font-weight: 500;
`;

const Td = styled.td`
  padding: 4px 4px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.4);
  vertical-align: middle;
`;

const AccountLink = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  color: ${TOK.accent};
  font-size: 12px;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;

const Amount = styled.span`
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
  text-align: right;
`;

/* ===== Ledger side ===== */
const LedgerHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
`;

const LedgerTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const LedgerSub = styled.div`
  font-size: 12px;
  color: ${TOK.sub};
`;

const Pill = styled.span`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 2px 8px;
  font-size: 11px;
  color: ${TOK.sub};
  margin-left: 6px;
`;

const LedgerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
`;

const BadgeDr = styled.span`
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid #22c55e55;
  background: #16a34a22;
  color: #86efac;
  font-size: 11px;
`;

const BadgeCr = styled.span`
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid #fb718555;
  background: #f9737322;
  color: #fecaca;
  font-size: 11px;
`;

const EmptyState = styled.div`
  font-size: 13px;
  color: ${TOK.sub};
  margin-top: 6px;
`;

/* ===== helpers ===== */
const money = (v) =>
    `₹ ${Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const toDateKey = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export default function JournalViewer() {
    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
    const [entries, setEntries] = useState([]);
    const [coaMap, setCoaMap] = useState({});
    const [loading, setLoading] = useState(false);

    const [ledgerAccountId, setLedgerAccountId] = useState(null);

    // ===== load Chart of Accounts once =====
    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(collection(db, "chartOfAccounts"));
                const map = {};
                snap.docs.forEach((d) => {
                    map[d.id] = { id: d.id, ...d.data() };
                });
                setCoaMap(map);
            } catch (e) {
                console.error("COA load failed", e);
            }
        })();
    }, []);

    // ===== load journal entries for selected date =====
    const loadEntries = async () => {
        if (!selectedDate) return;
        setLoading(true);
        try {
            const qRef = query(
                collection(db, "journalEntries"),
                where("dateKey", "==", selectedDate),
                orderBy("createdAt", "asc")
            );
            const snap = await getDocs(qRef);
            const list = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setEntries(list);
        } catch (e) {
            console.error("Journal load failed", e);
            setEntries([]);
        } finally {
            setLoading(false);
            setLedgerAccountId(null); // reset ledger when date changes
        }
    };

    useEffect(() => {
        loadEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const entriesCount = entries.length;
    const totalDebits = useMemo(
        () =>
            entries.reduce(
                (sum, e) =>
                    sum +
                    (Array.isArray(e.lines)
                        ? e.lines
                            .filter((l) => l.type === "DEBIT")
                            .reduce((s, l) => s + Number(l.amount || 0), 0)
                        : 0),
                0
            ),
        [entries]
    );
    const totalCredits = useMemo(
        () =>
            entries.reduce(
                (sum, e) =>
                    sum +
                    (Array.isArray(e.lines)
                        ? e.lines
                            .filter((l) => l.type === "CREDIT")
                            .reduce((s, l) => s + Number(l.amount || 0), 0)
                        : 0),
                0
            ),
        [entries]
    );

    // ===== ledger (for selected account within currently loaded entries) =====
    const ledgerRows = useMemo(() => {
        if (!ledgerAccountId) return [];

        const accMeta = coaMap[ledgerAccountId];
        const normal = accMeta?.normalBalance || "DEBIT";

        const raw = [];

        entries.forEach((e) => {
            (e.lines || []).forEach((ln) => {
                if (ln.accountId === ledgerAccountId) {
                    raw.push({
                        entryId: e.id,
                        dateKey: e.dateKey,
                        createdAt: e.createdAt,
                        narration: e.narration || "",
                        type: ln.type, // "DEBIT" / "CREDIT"
                        amount: Number(ln.amount || 0),
                    });
                }
            });
        });

        // sort by createdAt or dateKey
        raw.sort((a, b) => {
            const ta =
                a.createdAt?.toDate?.() instanceof Date
                    ? a.createdAt.toDate().getTime()
                    : new Date(a.dateKey || "").getTime();
            const tb =
                b.createdAt?.toDate?.() instanceof Date
                    ? b.createdAt.toDate().getTime()
                    : new Date(b.dateKey || "").getTime();
            return ta - tb;
        });

        // running balance
        let running = 0;
        const rows = raw.map((r) => {
            const isDr = r.type === "DEBIT";
            if (normal === "DEBIT") {
                running += isDr ? r.amount : -r.amount;
            } else {
                running += isDr ? -r.amount : r.amount;
            }
            return { ...r, balance: running };
        });

        return rows;
    }, [ledgerAccountId, entries, coaMap]);

    const ledgerAccount = ledgerAccountId ? coaMap[ledgerAccountId] : null;

    const onClickAccount = (accountId) => {
        setLedgerAccountId(accountId);
    };

    const friendlyChannel = (ch) => {
        if (!ch) return "GENERAL";
        return ch.replace(/_/g, " ");
    };

    const formatTime = (ts) => {
        if (!ts?.toDate) return "";
        return ts.toDate().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Page>
            <TitleRow>
                <div>
                    <H1>Journal Viewer</H1>
                    <Hint>
                        Browse daily journal entries and drill-down into account ledgers
                        with running balance.
                    </Hint>
                </div>

                {/* Right side: EOD button + filters */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <RunEodButton dateKey={selectedDate} onDone={loadEntries} />
                    <Filters>
                        <div style={{ fontSize: 12, color: TOK.sub }}>
                            Filter by date (IST)
                        </div>
                        <DateInput
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <RefreshBtn onClick={loadEntries}>Reload</RefreshBtn>
                    </Filters>
                </div>
            </TitleRow>

            <Layout>
                {/* LEFT: entries list */}
                <Panel>
                    <SectionTitle>Journal Entries</SectionTitle>
                    <EntriesMeta>
                        {loading
                            ? "Loading entries…"
                            : entriesCount === 0
                                ? "No journal entries for this date."
                                : `${entriesCount} entries • DR ${money(
                                    totalDebits
                                )} • CR ${money(totalCredits)}`}
                    </EntriesMeta>

                    {!loading &&
                        entries.map((e) => (
                            <EntryCard key={e.id}>
                                <EntryHead>
                                    <div>
                                        <span style={{ fontSize: 11, color: TOK.sub }}>
                                            Time: {formatTime(e.createdAt) || "--:--"}
                                        </span>
                                        {e.channel && (
                                            <Chip style={{ marginLeft: 6 }}>
                                                {friendlyChannel(e.channel)}
                                            </Chip>
                                        )}
                                    </div>
                                    <Chip>#{e.id.slice(-6)}</Chip>
                                </EntryHead>

                                {e.narration && <Narration>{e.narration}</Narration>}

                                <LinesTable>
                                    <thead>
                                        <tr>
                                            <Th style={{ width: 70 }}>Type</Th>
                                            <Th>Account</Th>
                                            <Th style={{ width: 110, textAlign: "right" }}>
                                                Amount
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(e.lines || []).map((ln, idx) => {
                                            const acc = ln.accountId ? coaMap[ln.accountId] : null;
                                            const label =
                                                acc?.name ||
                                                ln.accountName ||
                                                ln.accountId ||
                                                "Account";
                                            return (
                                                <tr key={idx}>
                                                    <Td>
                                                        {ln.type === "DEBIT" ? (
                                                            <BadgeDr>Dr</BadgeDr>
                                                        ) : (
                                                            <BadgeCr>Cr</BadgeCr>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <AccountLink
                                                            type="button"
                                                            onClick={() => onClickAccount(ln.accountId)}
                                                        >
                                                            {label}
                                                        </AccountLink>
                                                        {acc?.code && (
                                                            <span
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: TOK.sub,
                                                                    marginLeft: 4,
                                                                }}
                                                            >
                                                                ({acc.code})
                                                            </span>
                                                        )}
                                                    </Td>
                                                    <Td style={{ textAlign: "right" }}>
                                                        <Amount>{money(ln.amount)}</Amount>
                                                    </Td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </LinesTable>
                            </EntryCard>
                        ))}
                </Panel>

                {/* RIGHT: ledger viewer */}
                <Panel>
                    <SectionTitle>Ledger</SectionTitle>

                    {!ledgerAccountId && (
                        <EmptyState>
                            Click any account in the journal lines on the left to see its
                            ledger with running balance for this date.
                        </EmptyState>
                    )}

                    {ledgerAccountId && (
                        <>
                            <LedgerHeader>
                                <LedgerTitle>
                                    {ledgerAccount?.name || "Account"}{" "}
                                    {ledgerAccount?.code && (
                                        <span style={{ fontSize: 12, color: TOK.sub }}>
                                            ({ledgerAccount.code})
                                        </span>
                                    )}
                                </LedgerTitle>
                                <LedgerSub>
                                    Normal balance:{" "}
                                    <strong>{ledgerAccount?.normalBalance || "DEBIT"}</strong>
                                    {ledgerAccount?.type && <Pill>{ledgerAccount.type}</Pill>}
                                    <div style={{ marginTop: 4 }}>
                                        Date: <strong>{selectedDate}</strong>
                                    </div>
                                </LedgerSub>
                            </LedgerHeader>

                            {ledgerRows.length === 0 ? (
                                <EmptyState>
                                    No movements for this account in the selected
                                    date&apos;s journal entries.
                                </EmptyState>
                            ) : (
                                <LedgerTable>
                                    <thead>
                                        <tr>
                                            <Th style={{ width: 76 }}>Time</Th>
                                            <Th>Narration</Th>
                                            <Th style={{ width: 80, textAlign: "right" }}>Dr</Th>
                                            <Th style={{ width: 80, textAlign: "right" }}>Cr</Th>
                                            <Th style={{ width: 100, textAlign: "right" }}>
                                                Balance
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerRows.map((r, idx) => (
                                            <tr key={idx}>
                                                <Td>{formatTime(r.createdAt) || ""}</Td>
                                                <Td style={{ fontSize: 11 }}>{r.narration}</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    {r.type === "DEBIT" ? money(r.amount) : "—"}
                                                </Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    {r.type === "CREDIT" ? money(r.amount) : "—"}
                                                </Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(r.balance)}</Amount>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </LedgerTable>
                            )}
                        </>
                    )}
                </Panel>
            </Layout>
        </Page>
    );
}
