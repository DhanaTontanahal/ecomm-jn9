// src/pages/FinancialStatements.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";

const functions = getFunctions(app, "us-central1");

/* ===== tokens (reuse COA / Journal dark theme) ===== */
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

const Tabs = styled.div`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  overflow: hidden;
`;

const TabBtn = styled.button`
  padding: 6px 14px;
  font-size: 13px;
  border: none;
  background: ${(p) => (p.active ? TOK.accentSoft : "transparent")};
  color: ${(p) => (p.active ? TOK.accent : TOK.text)};
  cursor: pointer;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
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
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.div`
  font-size: 11px;
  color: ${TOK.sub};
  margin-bottom: 4px;
`;

const Select = styled.select`
  width: 100%;
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 7px 10px;
  background: rgba(15, 23, 42, 0.9);
  color: ${TOK.text};
  font-size: 13px;
`;

const DateInput = styled.input`
  width: 100%;
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 7px 10px;
  background: rgba(15, 23, 42, 0.9);
  color: ${TOK.text};
  font-size: 13px;
`;

const PrimaryBtn = styled.button`
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  padding: 8px 14px;
  background: ${(p) => (p.disabled ? "#4b5563" : TOK.accent)};
  color: #022c22;
  font-weight: 700;
  font-size: 13px;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
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

const Amount = styled.span`
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
  text-align: right;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const MetaText = styled.div`
  font-size: 12px;
  color: ${TOK.sub};
  margin-top: 4px;
`;

const ErrorText = styled.div`
  font-size: 12px;
  color: ${TOK.danger};
  margin-top: 4px;
`;

const money = (v) =>
    `₹ ${Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function FinancialStatements() {
    const [tab, setTab] = useState("PL"); // "PL" | "BS"

    // P&L controls
    const [plPreset, setPlPreset] = useState("THIS_MONTH");
    const [plFrom, setPlFrom] = useState("");
    const [plTo, setPlTo] = useState("");

    // BS controls
    const [bsAsOf, setBsAsOf] = useState("");

    // Results
    const [pl, setPl] = useState(null);
    const [bs, setBs] = useState(null);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const run = async () => {
        setLoading(true);
        setErr("");

        try {
            const fn = httpsCallable(functions, "computeFinancialStatements");
            const payload = { mode: tab === "PL" ? "PL" : "BS" };

            if (tab === "PL") {
                if (plPreset === "CUSTOM") {
                    payload.fromDateKey = plFrom;
                    payload.toDateKey = plTo;
                } else {
                    payload.preset = plPreset; // THIS_MONTH | LAST_MONTH | LAST_30_DAYS
                }
            }

            if (tab === "BS") {
                if (bsAsOf) {
                    payload.asOfDateKey = bsAsOf;
                }
            }

            const res = await fn(payload);
            if (!res.data || !res.data.ok) {
                setErr(res.data?.error || "Failed to compute statements.");
                return;
            }

            if (tab === "PL") {
                setPl(res.data.pl || null);
            } else {
                setBs(res.data.bs || null);
            }
        } catch (e) {
            console.error(e);
            setErr("Failed to compute statements. Check console / functions logs.");
        } finally {
            setLoading(false);
        }
    };

    const canRun =
        tab === "PL"
            ? plPreset === "CUSTOM"
                ? !!plFrom && !!plTo && !loading
                : !loading
            : !loading; // BS: only needs asOf (optional, backend uses today if empty)

    return (
        <Page>
            <TitleRow>
                <div>
                    <H1>Financial Statements</H1>
                    <Hint>
                        View Profit &amp; Loss for a period and Balance Sheet as of a
                        date, powered by your journal engine.
                    </Hint>
                </div>
                <Tabs>
                    <TabBtn active={tab === "PL"} onClick={() => setTab("PL")}>
                        Profit &amp; Loss
                    </TabBtn>
                    <TabBtn active={tab === "BS"} onClick={() => setTab("BS")}>
                        Balance Sheet
                    </TabBtn>
                </Tabs>
            </TitleRow>

            <Layout>
                {/* LEFT: controls + summary */}
                <Panel>
                    {tab === "PL" ? (
                        <>
                            <SectionTitle>Profit &amp; Loss</SectionTitle>
                            <Controls>
                                <div>
                                    <Label>Preset</Label>
                                    <Select
                                        value={plPreset}
                                        onChange={(e) => setPlPreset(e.target.value)}
                                    >
                                        <option value="THIS_MONTH">This Month (IST)</option>
                                        <option value="LAST_MONTH">Last Month (IST)</option>
                                        <option value="LAST_30_DAYS">Last 30 Days</option>
                                        <option value="CUSTOM">Custom Range</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>From (YYYY-MM-DD)</Label>
                                    <DateInput
                                        type="date"
                                        value={plFrom}
                                        onChange={(e) => setPlFrom(e.target.value)}
                                        disabled={plPreset !== "CUSTOM"}
                                    />
                                </div>
                                <div>
                                    <Label>To (YYYY-MM-DD)</Label>
                                    <DateInput
                                        type="date"
                                        value={plTo}
                                        onChange={(e) => setPlTo(e.target.value)}
                                        disabled={plPreset !== "CUSTOM"}
                                    />
                                </div>
                            </Controls>
                        </>
                    ) : (
                        <>
                            <SectionTitle>Balance Sheet</SectionTitle>
                            <Controls style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
                                <div>
                                    <Label>As of (YYYY-MM-DD)</Label>
                                    <DateInput
                                        type="date"
                                        value={bsAsOf}
                                        onChange={(e) => setBsAsOf(e.target.value)}
                                    />
                                </div>
                                <div style={{ fontSize: 11, color: TOK.sub, alignSelf: "center" }}>
                                    Leave blank to use today (IST) as of date.
                                </div>
                            </Controls>
                        </>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 4,
                            marginBottom: 6,
                        }}
                    >
                        <PrimaryBtn disabled={!canRun} onClick={run}>
                            {loading ? "Computing…" : "Run"}
                        </PrimaryBtn>
                    </div>

                    {err && <ErrorText>{err}</ErrorText>}

                    {!err && !loading && tab === "PL" && pl && (
                        <MetaText>
                            Period:{" "}
                            <strong>
                                {pl.fromDateKey} → {pl.toDateKey}
                            </strong>{" "}
                            • Income: <strong>{money(pl.totalIncome)}</strong> • Expense:{" "}
                            <strong>{money(pl.totalExpense)}</strong> • Net{" "}
                            <strong
                                style={{
                                    color: pl.netProfitLoss >= 0 ? "#4ade80" : "#f97373",
                                }}
                            >
                                {pl.netProfitLoss >= 0 ? "Profit" : "Loss"}{" "}
                                {money(Math.abs(pl.netProfitLoss))}
                            </strong>
                        </MetaText>
                    )}

                    {!err && !loading && tab === "BS" && bs && (
                        <MetaText>
                            As of: <strong>{bs.asOfDateKey}</strong> • Total Assets:{" "}
                            <strong>{money(bs.totalAssets)}</strong> • Total Liabilities +
                            Equity: <strong>{money(bs.totalLiabEquity)}</strong>{" "}
                            {Math.abs(bs.difference || 0) > 1 && (
                                <span style={{ color: TOK.danger }}>
                                    (Diff: {money(bs.difference)})
                                </span>
                            )}
                        </MetaText>
                    )}

                    {!err && !loading && !pl && !bs && (
                        <MetaText>Run once to see statement details.</MetaText>
                    )}
                </Panel>

                {/* RIGHT: tables */}
                <Panel>
                    {tab === "PL" ? (
                        pl ? (
                            <TwoCols>
                                <div>
                                    <SectionTitle>Income</SectionTitle>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <Th style={{ width: 70 }}>Code</Th>
                                                <Th>Account</Th>
                                                <Th style={{ width: 120, textAlign: "right" }}>
                                                    Amount
                                                </Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pl.incomeAccounts.map((a) => (
                                                <tr key={a.accountId}>
                                                    <Td>{a.code}</Td>
                                                    <Td>{a.name}</Td>
                                                    <Td style={{ textAlign: "right" }}>
                                                        <Amount>{money(a.amount)}</Amount>
                                                    </Td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <Td />
                                                <Td style={{ fontWeight: 600 }}>Total Income</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(pl.totalIncome)}</Amount>
                                                </Td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                                <div>
                                    <SectionTitle>Expenses</SectionTitle>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <Th style={{ width: 70 }}>Code</Th>
                                                <Th>Account</Th>
                                                <Th style={{ width: 120, textAlign: "right" }}>
                                                    Amount
                                                </Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pl.expenseAccounts.map((a) => (
                                                <tr key={a.accountId}>
                                                    <Td>{a.code}</Td>
                                                    <Td>{a.name}</Td>
                                                    <Td style={{ textAlign: "right" }}>
                                                        <Amount>{money(a.amount)}</Amount>
                                                    </Td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <Td />
                                                <Td style={{ fontWeight: 600 }}>Total Expenses</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(pl.totalExpense)}</Amount>
                                                </Td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                            </TwoCols>
                        ) : (
                            <MetaText>No P&amp;L data yet. Run a statement.</MetaText>
                        )
                    ) : bs ? (
                        <TwoCols>
                            <div>
                                <SectionTitle>Assets</SectionTitle>
                                <Table>
                                    <thead>
                                        <tr>
                                            <Th style={{ width: 70 }}>Code</Th>
                                            <Th>Account</Th>
                                            <Th style={{ width: 120, textAlign: "right" }}>
                                                Balance
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bs.assets.map((a) => (
                                            <tr key={a.accountId}>
                                                <Td>{a.code}</Td>
                                                <Td>{a.name}</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(a.balance)}</Amount>
                                                </Td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <Td />
                                            <Td style={{ fontWeight: 600 }}>Total Assets</Td>
                                            <Td style={{ textAlign: "right" }}>
                                                <Amount>{money(bs.totalAssets)}</Amount>
                                            </Td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                            <div>
                                <SectionTitle>Liabilities &amp; Equity</SectionTitle>
                                <Table>
                                    <thead>
                                        <tr>
                                            <Th style={{ width: 70 }}>Code</Th>
                                            <Th>Account</Th>
                                            <Th style={{ width: 120, textAlign: "right" }}>
                                                Balance
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bs.liabilities.map((a) => (
                                            <tr key={a.accountId}>
                                                <Td>{a.code}</Td>
                                                <Td>{a.name}</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(a.balance)}</Amount>
                                                </Td>
                                            </tr>
                                        ))}
                                        {bs.equity.map((a) => (
                                            <tr key={a.accountId}>
                                                <Td>{a.code}</Td>
                                                <Td>{a.name}</Td>
                                                <Td style={{ textAlign: "right" }}>
                                                    <Amount>{money(a.balance)}</Amount>
                                                </Td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <Td />
                                            <Td style={{ fontWeight: 600 }}>
                                                Total Liabilities + Equity
                                            </Td>
                                            <Td style={{ textAlign: "right" }}>
                                                <Amount>{money(bs.totalLiabEquity)}</Amount>
                                            </Td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </TwoCols>
                    ) : (
                        <MetaText>No Balance Sheet data yet. Run a statement.</MetaText>
                    )}
                </Panel>
            </Layout>
        </Page>
    );
}
