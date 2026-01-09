// src/components/Header.jsx
import React, { useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartContext";
import { FiShoppingBag, FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import CartDrawer from "./CartDrawer";

/* ===== Tokens aligned with Account page ===== */
const TOK = {
  maxW: "1280px",
  headerH: "68px",
  hairline: "rgba(0,0,0,.06)",
  border: "rgba(0,0,0,.08)",
  text: "#27303b",
  link: "#222831",
  brand: "#1c1c1c",
  pill: "rgba(16,24,40,.04)",
  glass: "rgba(255,255,255,.75)",
  green: "#5b7c3a",
};

const NoScrollX = createGlobalStyle`
  html, body, #root { max-width: 100%; overflow-x: hidden; }
`;

/* ===== Layout ===== */
const Shell = styled.header`
  position: sticky; top: 0; z-index: 60;
  background: ${TOK.glass};
  backdrop-filter: saturate(1.2) blur(8px);
  -webkit-backdrop-filter: saturate(1.2) blur(8px);
  box-shadow: 0 1px 0 ${TOK.hairline};
`;

const Bar = styled.div`
  height: ${TOK.headerH};
  max-width: ${TOK.maxW};
  margin: 0 auto;
  padding: 0 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 12px;
`;

/* Brand (matches Account page style) */
const BrandBtn = styled.button`
  display: inline-flex; align-items: center; gap: 10px;
  border: 0; background: transparent; cursor: pointer;
  min-width: 0;
`;
const LogoDot = styled.div`
  width: 34px; height: 34px; border-radius: 999px;
  border: 2px solid ${TOK.brand}; color: ${TOK.brand}; background: #fff;
  display: grid; place-items: center; font-weight: 900; font-size: 12px; line-height: 1;
`;
const Wordmark = styled.div`
  font-weight: 900; letter-spacing: .2px; color: ${TOK.brand};
  font-size: clamp(12px, 2.4vw, 14px);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 42vw;
  @media (min-width: 920px){ max-width: none; }
`;

/* Search placeholder slot (center) — keep empty for now */
const Center = styled.div`
  display: flex; justify-content: center; align-items: center;
  min-width: 0;
`;

/* Right controls (chips + icons) */
const Right = styled.div`
  display: flex; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0;
`;

/* Re-usable pill & icon chips */
const Chip = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid ${TOK.border};
  background: #fff;
  font-weight: 800; font-size: 13px; color: ${TOK.link};
  cursor: pointer; transition: background .15s, transform .05s;
  &:hover { background: ${TOK.pill}; }
  &:active { transform: translateY(1px); }
  @media (max-width: 420px){
    padding: 8px;
    span { display: none; } /* icon-only on tiny phones */
  }
  svg{ width: 18px; height: 18px; }
`;

const IconBtn = styled.button`
  appearance: none; border: 1px solid ${TOK.border};
  background: #fff; width: 40px; height: 40px; border-radius: 12px;
  display: grid; place-items: center; cursor: pointer;
  color: ${TOK.link}; transition: background .15s, transform .05s;
  &:hover { background: ${TOK.pill}; }
  &:active { transform: translateY(1px); }
  svg { width: 20px; height: 20px; }
`;

/* Cart with badge */
const CartWrap = styled.div` position: relative; `;
const Badge = styled.span`
  position: absolute; top: -6px; right: -6px;
  background: ${TOK.link}; color: #fff; font-weight: 900;
  border-radius: 999px; padding: 2px 6px; line-height: 1; font-size: 11px;
  border: 2px solid #fff;
`;

/* User bits */
const UserRow = styled.div`
  display: inline-flex; align-items: center; gap: 8px; min-width: 0;
`;
const Avatar = styled.div`
  width: 34px; height: 34px; border-radius: 999px; background: ${TOK.pill};
  color: ${TOK.text}; font-weight: 900; display: grid; place-items: center;
  border: 1px solid ${TOK.border};
`;
const Email = styled.span`
  color: #6b7280; font-weight: 700; font-size: 12px; max-width: 32vw;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  @media (min-width: 920px){ max-width: 360px; }
`;
const Logout = styled(Chip)`
  border-color: ${TOK.border};
`;

/* Helpers */
const initialsFrom = (user) => {
  const s = (user?.displayName || user?.email || "U").trim();
  const [a = "", b = ""] = s.split(" ");
  return (a[0] || "U").toUpperCase() + (b[0] || "").toUpperCase();
};

export default function Header() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const nav = useNavigate();
  const loc = useLocation();

  // brand from anywhere central later if needed
  const brand = useMemo(() => ({
    name: "Prakruti Farms Bharat",
    initials: "PFB"
  }), []);

  return (
    <>
      <NoScrollX />
      <Shell>
        <Bar>
          {/* Brand (click -> home) */}
          <BrandBtn onClick={() => nav("/")}>
            <LogoDot>{(brand.initials || "PFB").slice(0, 3)}</LogoDot>
            <Wordmark>{brand.name || "Prakruti Farms Bharat"}</Wordmark>
          </BrandBtn>

          {/* Center placeholder (kept minimal to match Account page density) */}
          <Center />

          {/* Right controls */}
          <Right>
            {/* Cart */}
            <CartWrap title="Open cart">
              <Chip onClick={cart.toggleCart}>
                <FiShoppingBag />
                <span>Cart</span>
              </Chip>
              <Badge>{cart?.totalQty ?? 0}</Badge>
            </CartWrap>

            {/* Auth */}
            {user ? (
              <UserRow>
                <Avatar>{initialsFrom(user)}</Avatar>
                <Email>{user.email}</Email>
                <Logout onClick={logout} title="Logout">
                  <FiLogOut />
                  <span>Logout</span>
                </Logout>
              </UserRow>
            ) : (
              <IconBtn
                aria-label="Login"
                title="Login"
                onClick={() => nav("/login", { state: { from: loc } })}
              >
                <FiUser />
              </IconBtn>
            )}
          </Right>
        </Bar>
      </Shell>

      <CartDrawer />
    </>
  );
}
