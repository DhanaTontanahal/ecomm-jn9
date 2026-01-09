// src/components/Header.jsx
import styled from "styled-components";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartContext";
import { FiShoppingBag, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CartDrawer from "./CartDrawer";

const Bar = styled.header`
  height: 56px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; border-bottom: 1px solid ${({ theme }) => theme.colors?.border || "rgba(16,24,40,.1)"};
  background: ${({ theme }) => theme.colors?.panel || "#fff"};
  position: sticky; top: 0; z-index: 50;
`;

const Right = styled.div`display:flex; gap:12px; align-items:center;`;

const CartBtn = styled.button`
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 10px; border:1px solid rgba(16,24,40,.15);
  border-radius:10px; background:#fff; cursor:pointer;
`;

const IconBtn = styled.button`
  appearance: none; border: 1px solid rgba(16,24,40,.15);
  background: #fff; width: 40px; height: 40px; border-radius: 10px;
  display: grid; place-items: center; cursor: pointer;
  color: #111; transition: background .15s ease;
  &:hover { background: #f9fafb; }
  svg { width: 20px; height: 20px; }
`;

export default function Header() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const nav = useNavigate();

  return (
    <>
      <Bar>
        <div style={{ fontWeight: 700 }} />
        
        <Right>
          <CartBtn onClick={cart.toggleCart} title="Open cart">
            <FiShoppingBag /> Shopping ({cart.totalQty})
          </CartBtn>

          {user ? (
            <>
              <span style={{ marginRight: 12, color: '#6b7280', fontSize: 14 }}>
                {user.email}
              </span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <IconBtn
              aria-label="Login"
              title="Login"
              onClick={() => nav("/login")}
            >
              <FiUser />
            </IconBtn>
          )}
        </Right>
      </Bar>

      <CartDrawer />
    </>
  );
}
