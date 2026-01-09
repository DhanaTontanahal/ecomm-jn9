// src/components/ZohoConnectButton.jsx
import React from "react";

const BACKEND_BASE =
    import.meta.env.VITE_API_BASE ||
    "https://pfb-be-staging-1041275605700.us-central1.run.app";

export default function ZohoConnectButton() {
    const handleConnect = () => {
        window.location.href = `${BACKEND_BASE}/auth/zoho`;
    };

    return (
        <button
            onClick={handleConnect}
            style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
            }}
        >
            Connect Zoho Inventory
        </button>
    );
}
