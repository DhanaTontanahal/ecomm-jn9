// src/pages/ConnectZoho.jsx
import React, { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import ZohoConnectButton from "../components/ZohoConnectButton";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ConnectZoho = () => {
  const query = useQuery();
  const status = query.get("status"); // e.g. ?status=success or ?status=error
  const messageFromBackend = query.get("message"); // optional later if you send it

  let title = "Connect Zoho Inventory";
  let subtitle =
    "Link your Zoho Inventory account to sync items, stock and orders with this admin panel.";
  let bannerColor = "#4b5563";

  if (status === "success") {
    title = "Zoho Inventory Connected ✅";
    subtitle =
      "Your Zoho Inventory account is now linked. You can now import items and sync stock.";
    bannerColor = "#16a34a";
  } else if (status === "error") {
    title = "Zoho Connection Failed ❌";
    subtitle =
      messageFromBackend ||
      "There was a problem connecting to Zoho. Please try again using the button below.";
    bannerColor = "#dc2626";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#0f172a",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "#e5e7eb",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h1>

        <p style={{ marginBottom: 20, color: "#9ca3af" }}>{subtitle}</p>

        <div
          style={{
            width: "100%",
            height: 4,
            borderRadius: 999,
            background: "#1f2937",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: bannerColor,
            }}
          />
        </div>

        {/* Connect / Reconnect button */}
        <div style={{ marginBottom: 16 }}>
          <ZohoConnectButton />
        </div>

        {/* Optional: link back to dashboard/home */}
        <Link
          to="/"
          style={{
            display: "inline-flex",
            marginTop: 8,
            fontSize: 14,
            color: "#9ca3af",
            textDecoration: "none",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ConnectZoho;
