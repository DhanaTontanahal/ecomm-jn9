import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useCart } from "../../cart/CartContext";

const rise = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;
const pulse = keyframes`
  0% { transform: scale(1) }
  50%{ transform: scale(1.05) }
  100%{ transform: scale(1) }
`;

const Wrap = styled.div`
  position: fixed; left: 0; right: 0;
  bottom: calc(64px + env(safe-area-inset-bottom, 0)); /* sits above BottomTabs */
  z-index: 65; /* Tabs are 60 */
  display: none;
  @media (max-width: 768px) { display: block; }
`;

const Card = styled.div`
  margin: 0 auto;
  max-width: 560px;
  background: #ffffff;
  border: 1px solid rgba(16,24,40,.12);
  border-radius: 16px;
  box-shadow: 0 14px 34px rgba(16,24,40,.12);
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  animation: ${rise} .22s ease both;
`;

const Left = styled.div`
  display: grid; gap: 4px;
`;

const Row = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  strong { font-weight: 900; }
  .count { font-weight: 900; }
  .save { color: #16a34a; font-weight: 800; }
  .chip {
    display: inline-flex; align-items:center; gap: 6px;
    padding: 4px 8px; border-radius: 999px;
    background: #f1f5f9; color: #0f172a; font-size: 12px; font-weight: 800;
  }
  .confetti { filter: drop-shadow(0 2px 4px rgba(0,0,0,.12)); }
`;

const CTA = styled.button`
  align-self: center;
  border: 0; border-radius: 12px;
  background: #5b7c3a;
  color: #fff; font-weight: 900;
  padding: 12px 14px; cursor: pointer;
  min-width: 120px;
  animation: ${pulse} 2.2s ease infinite;
`;

const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

export default function MobileCartSummaryBar() {
    const cart = useCart();

    const qty = cart?.totalQty ?? cart?.items?.reduce((n, i) => n + (i.qty || 0), 0) ?? 0;

    const savings = useMemo(() => {
        // Prefer MRP savings; fallback to cashback if no MRP data
        const mrpSave = (cart?.items || []).reduce((s, x) => {
            const mrp = Number(x.mrp || 0);
            const price = Number(x.price || 0);
            const diff = mrp > price ? (mrp - price) * (x.qty || 1) : 0;
            return s + diff;
        }, 0);
        if (mrpSave > 0) return mrpSave;
        const cb = (cart?.items || []).reduce((s, x) => s + Number(x.cashbackAmount || 0) * (x.qty || 1), 0);
        return cb;
    }, [cart?.items]);

    if (!qty) return null;

    const openCart = () => {
        // Uses your CartContext's opener (as in CartDrawer usage)
        if (cart?.openCart) cart.openCart();
        else if (cart?.open === false && cart?.toggle) cart.toggle(true);
        else if (cart?.setOpen) cart.setOpen(true);
    };

    return (
        <Wrap>
            <Card>
                <Left>
                    <Row>
                        <span className="chip">
                            <span role="img" aria-label="party" className="confetti">🎉</span>
                            <strong>Great choice!</strong>
                        </span>
                    </Row>
                    <Row>
                        <span className="count">{qty} item{qty > 1 ? "s" : ""}</span>
                        {savings > 0 && <span className="save">• You save {money(savings)}</span>}
                    </Row>
                </Left>
                <CTA onClick={openCart}>View Cart</CTA>
            </Card>
        </Wrap>
    );
}
