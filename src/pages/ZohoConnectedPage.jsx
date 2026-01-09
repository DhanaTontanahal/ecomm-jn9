import React, { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

const ZohoConnectedPage = () => {
    const query = useQuery();
    const status = query.get("status"); // success / error (we sent ?status=success)
    const msgFromZoho = query.get("message"); // if you ever add this later

    let title = "Zoho Inventory Connection";
    let message = "Connecting to Zoho…";
    let color = "#e5e7eb";

    if (status === "success") {
        title = "Zoho connected ✅";
        message =
            "Your Zoho Inventory account is now linked. You can start syncing products and stock.";
        color = "#16a34a";
    } else if (status === "error") {
        title = "Zoho connection failed ❌";
        message =
            msgFromZoho ||
            "There was a problem completing the Zoho connection. Please try again.";
        color = "#dc2626";
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#020617",
                color: "#e5e7eb",
                padding: "16px",
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    width: "100%",
                    background: "#0f172a",
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
            >
                <h1 style={{ fontSize: 24, marginBottom: 12 }}>{title}</h1>
                <p style={{ marginBottom: 16, color: "#9ca3af" }}>{message}</p>

                <div
                    style={{
                        height: 4,
                        borderRadius: 999,
                        background: "#1f2937",
                        overflow: "hidden",
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background: color,
                        }}
                    />
                </div>

                <Link
                    to="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px 16px",
                        borderRadius: 999,
                        background: "#22c55e",
                        color: "#020617",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ZohoConnectedPage;
