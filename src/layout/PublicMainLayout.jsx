import React from "react";
import { Outlet } from "react-router-dom";
import BottomTabs from "../components/mobile/BottomTabs";
import CartDrawer from "../components/CartDrawer";
import MobileCartSummaryBar from "../components/mobile/MobileCartSummaryBar";
import { useCart } from "../cart/CartContext";

export default function PublicMainLayout({ children }) {
  const cart = useCart();
  const qty = cart?.totalQty ?? cart?.items?.reduce((n, i) => n + (i.qty || 0), 0) ?? 0;

  // Base 76px (tabs). When mini-bar shows, add ~70px more.
  const bottomPad = qty ? 146 : 76;

  return (
    <>
      <main style={{ minHeight: "100dvh", paddingBottom: bottomPad }}>
        {children ?? <Outlet />}
      </main>

      {/* Mini cart summary (mobile) */}
      <MobileCartSummaryBar />

      {/* Bottom navigation (mobile) */}
      <BottomTabs />

      {/* Drawer mounted once globally */}
      <CartDrawer />
    </>
  );
}
