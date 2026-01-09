// src/layout/PublicMainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import HeaderWithCarousel from "../components/HeaderWithCarousel";
// or your other public header
import BottomTabs from "../components/mobile/BottomTabs";
import CartDrawer from "../components/CartDrawer";

export default function PublicMainLayout({ children }) {
  return (
    <>
      <main style={{ minHeight: "100dvh", paddingBottom: 76 }}>
        {children ?? <Outlet />}
      </main>
      <BottomTabs />
      {/* Mount the drawer once */}
      <CartDrawer />
    </>
  );
}
