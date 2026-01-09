import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartCtx = createContext();

const initialState = {
  open: false,
  items: [], // {id,title,price,imageUrl,qty, mrp, sizeLabel, subtitle, cashbackAmount}
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { ...state, ...(action.payload || {}) };

    case "OPEN":
      return { ...state, open: true };
    case "CLOSE":
      return { ...state, open: false };
    case "TOGGLE":
      return { ...state, open: !state.open };

    case "ADD": {
      const p = action.payload; // expects at least {id,title,price}
      const idx = state.items.findIndex(x => x.id === p.id);
      const next = [...state.items];
      if (idx === -1) next.push({ ...p, qty: 1 });
      else next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return { ...state, items: next };
    }

    case "INC": {
      const id = action.payload;
      const next = state.items.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x);
      return { ...state, items: next };
    }
    case "DEC": {
      const id = action.payload;
      let next = state.items.map(x => x.id === id ? { ...x, qty: x.qty - 1 } : x);
      next = next.filter(x => x.qty > 0);
      return { ...state, items: next };
    }
    case "REMOVE": {
      const id = action.payload;
      return { ...state, items: state.items.filter(x => x.id !== id) };
    }
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("app_cart_v1") || "{}");
      if (saved && (saved.items || saved.open !== undefined)) {
        dispatch({ type: "INIT", payload: { items: saved.items || [], open: false } });
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem("app_cart_v1", JSON.stringify({ items: state.items }));
  }, [state.items]);

  const totalQty = useMemo(() => state.items.reduce((s, x) => s + x.qty, 0), [state.items]);
  const subtotal = useMemo(() => state.items.reduce((s, x) => s + (Number(x.price||0) * x.qty), 0), [state.items]);

  const api = useMemo(() => ({
    open: state.open,
    items: state.items,
    totalQty, subtotal,
    openCart: () => dispatch({ type: "OPEN" }),
    closeCart: () => dispatch({ type: "CLOSE" }),
    toggleCart: () => dispatch({ type: "TOGGLE" }),
    addItem: (p) => dispatch({ type: "ADD", payload: p }),
    inc: (id) => dispatch({ type: "INC", payload: id }),
    dec: (id) => dispatch({ type: "DEC", payload: id }),
    remove: (id) => dispatch({ type: "REMOVE", payload: id }),
    clear: () => dispatch({ type: "CLEAR" })
  }), [state.open, state.items, totalQty, subtotal]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
