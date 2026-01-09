// src/pages/GstDashboard.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";

const functions = getFunctions(app, "us-central1");

/* ===== tokens ===== */
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

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
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

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 4px;

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.9);
  background: rgba(15, 23, 42, 0.7);
  padding: 10px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${TOK.sub};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const StatSub = styled.div`
  font-size: 11px;
  color: ${TOK.sub};
  margin-top: 2px;
`;

const PeriodText = styled.div`
  font-size: 12px;
  color: ${TOK.sub};
  margin-top: 6px;
`;

const money = (v) =>
    `₹ ${Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function GstDashboard() {
    const [mode, setMode] = useState("THIS_MONTH");
    const [fromDateKey, setFromDateKey] = useState("");
    const [toDateKey, setToDateKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState("");

    React.useEffect(() => {
        handleRun(); // will use default mode THIS_MONTH
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleRun = async () => {
        setLoading(true);
        setError("");
        setSummary(null);

        try {
            const fn = httpsCallable(functions, "computeGstSummary");
            const payload = {};

            if (mode === "CUSTOM" && fromDateKey > toDateKey) {
                setError("From date cannot be after To date.");
                setLoading(false);
                return;
            } else {
                payload.preset = mode; // THIS_MONTH | LAST_MONTH | LAST_30_DAYS
            }

            const res = await fn(payload);
            if (!res.data || !res.data.ok) {
                setError(res.data?.error || "Failed to compute GST summary.");
            } else {
                setSummary(res.data.summary || null);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to compute GST summary. Check console / functions logs.");
        } finally {
            setLoading(false);
        }
    };

    const canRun =
        mode === "CUSTOM"
            ? !!fromDateKey && !!toDateKey && !loading
            : !loading;

    return (
        <Page>
            <TitleRow>
                <div>
                    <H1>GST Dashboard</H1>
                    <Hint>
                        Compute GST output for a period using posted journal entries
                        (EOD sales). Later we can extend this for input tax, GSTR-1/3B
                        export, etc.
                    </Hint>
                </div>
            </TitleRow>

            <Layout>
                {/* LEFT: controls + summary cards */}
                <Panel>
                    <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Select Period</h3>

                    <Controls>
                        <div>
                            <div style={{ fontSize: 11, color: TOK.sub, marginBottom: 4 }}>
                                Mode
                            </div>
                            <Select
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                            >
                                <option value="THIS_MONTH">This Month (IST)</option>
                                <option value="LAST_MONTH">Last Month (IST)</option>
                                <option value="LAST_30_DAYS">Last 30 Days</option>
                                <option value="CUSTOM">Custom Range</option>
                            </Select>
                        </div>

                        <div>
                            <div style={{ fontSize: 11, color: TOK.sub, marginBottom: 4 }}>
                                From (YYYY-MM-DD)
                            </div>
                            <DateInput
                                type="date"
                                value={fromDateKey}
                                onChange={(e) => setFromDateKey(e.target.value)}
                                disabled={mode !== "CUSTOM"}
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: 11, color: TOK.sub, marginBottom: 4 }}>
                                To (YYYY-MM-DD)
                            </div>
                            <DateInput
                                type="date"
                                value={toDateKey}
                                onChange={(e) => setToDateKey(e.target.value)}
                                disabled={mode !== "CUSTOM"}
                            />
                        </div>
                    </Controls>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 4,
                            marginBottom: 6,
                        }}
                    >
                        <PrimaryBtn disabled={!canRun} onClick={handleRun}>
                            {loading ? "Computing…" : "Compute GST Summary"}
                        </PrimaryBtn>
                    </div>

                    {error && (
                        <div style={{ fontSize: 12, color: TOK.danger, marginTop: 4 }}>
                            {error}
                        </div>
                    )}

                    {summary && (
                        <>
                            <PeriodText>
                                Period:{" "}
                                <strong>
                                    {summary.fromDateKey} → {summary.toDateKey}
                                </strong>{" "}
                                • Journal entries considered:{" "}
                                <strong>{summary.entriesCount}</strong>
                            </PeriodText>

                            <CardGrid>
                                <StatCard>
                                    <StatLabel>Taxable Outward Supplies</StatLabel>
                                    <StatValue>{money(summary.taxableOutward)}</StatValue>
                                    <StatSub>Sum of Sales Online + POS (credit)</StatSub>
                                </StatCard>

                                <StatCard>
                                    <StatLabel>GST Output (Liability)</StatLabel>
                                    <StatValue>{money(summary.gstOutput)}</StatValue>
                                    <StatSub>From GST Output account (credit lines)</StatSub>
                                </StatCard>

                                <StatCard>
                                    <StatLabel>Effective GST Rate</StatLabel>
                                    <StatValue>
                                        {summary.effectiveRate?.toFixed(2)}%
                                    </StatValue>
                                    <StatSub>gstOutput / taxableOutward × 100</StatSub>
                                </StatCard>

                                {/* NEW: Input Tax Credit */}
                                <StatCard>
                                    <StatLabel>GST Input (ITC from Expenses)</StatLabel>
                                    <StatValue>{money(summary.gstInput || 0)}</StatValue>
                                    <StatSub>Debits to GST Input A/c from journals</StatSub>
                                </StatCard>

                                {/* NEW: Net GST Payable */}
                                <StatCard>
                                    <StatLabel>Net GST Payable</StatLabel>
                                    <StatValue>{money(summary.netGstPayable || 0)}</StatValue>
                                    <StatSub>
                                        Positive = payable, negative = refundable
                                    </StatSub>
                                </StatCard>
                            </CardGrid>

                        </>
                    )}

                    {!summary && !error && !loading && (
                        <div style={{ fontSize: 12, color: TOK.sub, marginTop: 8 }}>
                            Run a summary to see GST figures for the selected period.
                        </div>
                    )}
                </Panel>

                {/* RIGHT: future space – e.g. invoice list, export buttons */}
                <Panel>
                    <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Coming next</h3>
                    <p style={{ fontSize: 12, color: TOK.sub, marginTop: 4 }}>
                        In the next steps we can add:
                    </p>
                    <ul style={{ fontSize: 12, color: TOK.sub, paddingLeft: 18 }}>
                        <li>Invoice-wise outward supplies list (GSTR-1 style)</li>
                        <li>Input tax from purchase journals (GST Input A/c)</li>
                        <li>Net GST payable = Output − Input</li>
                        <li>Export to Excel / JSON for filing portal</li>
                    </ul>
                </Panel>
            </Layout>
        </Page>
    );
}
