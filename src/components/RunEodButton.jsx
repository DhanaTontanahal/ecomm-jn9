// src/components/accounting/RunEodButton.jsx
import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase"; // adjust path if needed

const functions = getFunctions(app, "us-central1");

/**
 * Props:
 *  - dateKey?: "YYYY-MM-DD"     // usually JournalViewer's selectedDate
 *  - onDone?: (result) => void  // callback after success (e.g. reload entries)
 *
 * Usage from JournalViewer:
 *   <RunEodButton dateKey={selectedDate} onDone={loadEntries} />
 */
export default function RunEodButton({ dateKey, onDone }) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("ONE_DAY"); // "ONE_DAY" | "PRESET" | "RANGE"
    const [preset, setPreset] = useState("LAST_7_DAYS");
    const [fromDateKey, setFromDateKey] = useState(dateKey || "");
    const [toDateKey, setToDateKey] = useState(dateKey || "");

    const runNow = async () => {
        setLoading(true);
        try {
            let data;
            if (mode === "ONE_DAY") {
                const fn = httpsCallable(functions, "runEodSalesToJournalNow");
                const payload = dateKey ? { dateKey } : {};
                const res = await fn(payload);
                data = res.data || {};

                alert(
                    data.message ||
                    `EOD journals processed for ${data.dateKey || dateKey || "selected date"}`
                );
            } else {
                // presets & custom range → backfillEodSalesToJournal
                const fn = httpsCallable(functions, "backfillEodSalesToJournal");

                let payload;
                if (mode === "PRESET") {
                    payload = { preset }; // e.g. "LAST_7_DAYS"
                } else {
                    // RANGE
                    if (!fromDateKey || !toDateKey) {
                        alert("Please select both From and To dates for the range.");
                        setLoading(false);
                        return;
                    }
                    payload = { fromDateKey, toDateKey };
                }

                const res = await fn(payload);
                data = res.data || {};

                if (data.ok === false && data.error) {
                    alert(`Backfill failed: ${data.error}`);
                } else {
                    const msgBase =
                        mode === "PRESET"
                            ? `Backfill EOD (${preset.replace(/_/g, " ")})`
                            : `Backfill EOD from ${data.fromDateKey} to ${data.toDateKey}`;
                    alert(
                        `${msgBase} completed for ${data.daysProcessed} day(s).`
                    );
                }
            }

            if (onDone) onDone(data);
        } catch (e) {
            console.error(e);
            alert("Failed to run EOD. Check console / Cloud Functions logs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 8, alignItems: "flex-start" }}>
            {/* Main action button */}
            <button
                onClick={runNow}
                disabled={loading}
                style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,.4)",
                    background: loading ? "#4b5563" : "#16a34a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: loading ? "default" : "pointer",
                    whiteSpace: "nowrap",
                }}
            >
                {loading
                    ? "Processing…"
                    : mode === "ONE_DAY"
                        ? `Run EOD for ${dateKey || "today"}`
                        : mode === "PRESET"
                            ? `Backfill (${preset.replace(/_/g, " ")})`
                            : "Backfill Custom Range"}
            </button>

            {/* Mode + options (small control block) */}
            <div
                style={{
                    display: "grid",
                    gap: 6,
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(15,23,42,0.96)",
                    maxWidth: 260,
                    fontSize: 11,
                    color: "#cbd5f5",
                }}
            >
                <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2 }}>
                    EOD Mode
                </div>

                {/* Mode selection */}
                <div
                    style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setMode("ONE_DAY")}
                        style={{
                            flex: 1,
                            padding: "4px 6px",
                            borderRadius: 999,
                            border:
                                mode === "ONE_DAY"
                                    ? "1px solid #4ade80"
                                    : "1px solid rgba(148,163,184,.5)",
                            background:
                                mode === "ONE_DAY"
                                    ? "rgba(74,222,128,0.12)"
                                    : "transparent",
                            color: "#e5e7eb",
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        Selected day
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("PRESET")}
                        style={{
                            flex: 1,
                            padding: "4px 6px",
                            borderRadius: 999,
                            border:
                                mode === "PRESET"
                                    ? "1px solid #4ade80"
                                    : "1px solid rgba(148,163,184,.5)",
                            background:
                                mode === "PRESET"
                                    ? "rgba(74,222,128,0.12)"
                                    : "transparent",
                            color: "#e5e7eb",
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        Preset range
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("RANGE")}
                        style={{
                            flex: 1,
                            padding: "4px 6px",
                            borderRadius: 999,
                            border:
                                mode === "RANGE"
                                    ? "1px solid #4ade80"
                                    : "1px solid rgba(148,163,184,.5)",
                            background:
                                mode === "RANGE"
                                    ? "rgba(74,222,128,0.12)"
                                    : "transparent",
                            color: "#e5e7eb",
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        Custom range
                    </button>
                </div>

                {/* Mode-specific inputs */}
                {mode === "PRESET" && (
                    <div style={{ marginTop: 4 }}>
                        <div style={{ marginBottom: 2 }}>Preset</div>
                        <select
                            value={preset}
                            onChange={(e) => setPreset(e.target.value)}
                            style={{
                                width: "100%",
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,.5)",
                                background: "rgba(15,23,42,0.9)",
                                color: "#e5e7eb",
                                fontSize: 11,
                                padding: "4px 8px",
                            }}
                        >
                            <option value="LAST_7_DAYS">Last 7 days</option>
                            <option value="LAST_30_DAYS">Last 30 days</option>
                            <option value="LAST_60_DAYS">Last 60 days</option>
                        </select>
                    </div>
                )}

                {mode === "RANGE" && (
                    <div style={{ marginTop: 4, display: "grid", gap: 4 }}>
                        <div>From</div>
                        <input
                            type="date"
                            value={fromDateKey}
                            onChange={(e) => setFromDateKey(e.target.value)}
                            style={{
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,.5)",
                                background: "rgba(15,23,42,0.9)",
                                color: "#e5e7eb",
                                fontSize: 11,
                                padding: "4px 8px",
                            }}
                        />
                        <div>To</div>
                        <input
                            type="date"
                            value={toDateKey}
                            onChange={(e) => setToDateKey(e.target.value)}
                            style={{
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,.5)",
                                background: "rgba(15,23,42,0.9)",
                                color: "#e5e7eb",
                                fontSize: 11,
                                padding: "4px 8px",
                            }}
                        />
                    </div>
                )}

                {mode === "ONE_DAY" && (
                    <div style={{ marginTop: 2 }}>
                        Will run for: <strong>{dateKey || "today (IST)"}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}
