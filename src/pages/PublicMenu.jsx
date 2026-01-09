// src/pages/PublicMenu.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase"; // adjust if your path differs
import { useCart } from "../cart/CartContext";
import { FiSearch, FiStar } from "react-icons/fi";
import Lottie from "react-lottie-player";

/* ===== Tokens ===== */
const TOK = {
  bg: "#ffffff",
  border: "rgba(16,24,40,.10)",
  text: "#1f2a37",
  sub: "#6b7280",
  green: "#5b7c3a",
  greenD: "#48652f",
  pill: "#f5f6f7",
  pillActive: "#ffefe8",
  pillActiveText: "#e86a33",
  shimmer: "#f3f4f6",
};

const fade = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}`;

/* global guard – prevents any accidental horizontal scroll */
const NoXOverflow = createGlobalStyle`
   *, *::before, *::after { box-sizing: border-box; }
   html, body, #root { max-width: 100%; overflow-x: hidden; }
   img, svg, canvas, video { max-width: 100%; display: block; }
 `;


/* ===== Empty state ===== */
const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-6px) }
  100% { transform: translateY(0) }
`;

const EmptyWrap = styled.div`
  display: grid; place-items: center;
  padding: clamp(24px, 6vw, 48px) 12px 90px;
`;

const EmptyCard = styled.div`
  border: 1px solid ${TOK.border};
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(16,24,40,.08);
  padding: clamp(18px, 4vw, 28px);
  max-width: 560px; width: 100%;
  text-align: center;
  animation: ${fade} .25s ease both;
`;

const EmptyAnim = styled.div`
  display: grid; place-items: center;
  margin: 4px 0 12px;
  > * { animation: ${float} 3s ease-in-out infinite; }
`;

const EmptyTitle = styled.h3`
  margin: 6px 0 4px;
  font-size: clamp(18px, 4.6vw, 22px);
  color: ${TOK.text};
`;

const EmptySub = styled.p`
  margin: 0 0 14px;
  color: ${TOK.sub};
  font-size: 14px;
`;

const EmptyActions = styled.div`
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
`;

const EmptyBtn = styled.button`
  border: 1px solid ${TOK.border};
  background: #fff;
  color: ${TOK.text};
  padding: 10px 14px; border-radius: 12px; font-weight: 800;
  cursor: pointer;
`;

const PrimaryBtn = styled(EmptyBtn)`
  background: ${TOK.green};
  border-color: ${TOK.greenD};
  color: #fff;
`;

const EmptyGhost = styled.div`
  width: 160px; height: 160px; border-radius: 20px;
  background: linear-gradient(180deg, ${TOK.shimmer}, #fff);
  display: grid; place-items: center;
  svg { width: 72px; height: 72px; opacity: .85; }
`;






/* ===== Layout ===== */
const Page = styled.div`
   background: ${TOK.bg};
   padding: 10px 12px 90px; /* bottom space for mobile bottom tabs */
   -webkit-tap-highlight-color: transparent;
   max-width: 100%;
   overflow-x: hidden;          /* page-level guard */
 `;

const TopBar = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
`;

const Search = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${TOK.border};
  border-radius: 999px;
  padding: 8px 12px;
  input {
    border: 0; outline: 0; flex: 1; font-size: 14px; color: ${TOK.text};
  }
  svg { color: ${TOK.sub}; }
`;

/* Horizontal category tabs */
const TabsWrap = styled.div`
   position: sticky; top: 0; left: 0; right: 0; z-index: 10;
   background: ${TOK.bg};
   padding: 8px 12px 10px;      /* match Page padding so it doesn’t jut out */
 `;

const Tabs = styled.div`
   display: flex; gap: 10px; overflow-x: auto; overscroll-behavior: contain;
   padding-bottom: 2px;
   min-width: 0;                /* prevent flex from blowing out width */
   &::-webkit-scrollbar { display: none; }
 `;

const Tab = styled.button`
  flex: 0 0 auto;
  border: 1px solid ${TOK.border};
  background: ${(p) => (p.$active ? TOK.pillActive : TOK.pill)};
  color: ${(p) => (p.$active ? TOK.pillActiveText : TOK.text)};
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  font-size: 13px;
  white-space: nowrap;
`;

const Count = styled.span`
  color: ${TOK.sub};
  font-size: 12px;
  margin-left: 4px;
`;

const Grid = styled.div`
   display: grid; gap: 10px;
   grid-template-columns: minmax(0,1fr); /* key: allow children to shrink */
   @media (min-width: 420px){ grid-template-columns: repeat(2, minmax(0,1fr)); }
   @media (min-width: 840px){ grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
   @media (min-width: 1200px){ grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
 `;

const Card = styled.div`
  border: 1px solid ${TOK.border};
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(16,24,40,.06);
  animation: ${fade} .25s ease both;
  min-width: 0;            
`;

const ImgWrap = styled.div`
  aspect-ratio: 1 / 1;
  background: ${TOK.shimmer};
  display: grid; place-items: center;
  img { width: 100%; height: 100%; object-fit: contain; }
`;

const Body = styled.div` padding: 10px 10px 12px; `;
const Title = styled.div`
  color:${TOK.text}; font-weight: 800;
  font-size: clamp(14px, 4vw, 16px);
  display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
`;
const Sub = styled.div` margin-top: 2px; color:${TOK.sub}; font-size: 12px; `;
const PriceRow = styled.div`
  margin-top:6px; display:flex; align-items:baseline; gap:8px;
  .mrp{color:#9ca3af; text-decoration:line-through; font-size: 12px;}
  .price{color:${TOK.text}; font-weight: 900; font-size: clamp(16px, 4.6vw, 18px);}
`;
const AddBtn = styled.button`
  width:100%; margin-top:10px; height:44px;
  border:none; border-radius:12px;
  background:${TOK.green}; color:#fff; font-weight:900; letter-spacing:.2px;
  cursor:pointer; transition: transform .05s ease;
  &:active{ transform: translateY(1px); }
`;
const Stepper = styled.div`
  display:inline-flex; align-items:center; gap:0; margin-top:10px;
  border:1px solid ${TOK.border}; border-radius:12px; overflow:hidden;
  button{ width:40px; height:40px; border:0; background:#fff; font-size:20px; line-height:0; }
  span{ min-width:34px; text-align:center; font-weight:900; font-size:14px; }
`;

const Meta = styled.div`
  margin-top:8px; display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:${TOK.sub};
`;

/* ===== helpers ===== */
const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

/* ===== Component ===== */
export default function PublicMenu() {
  const cart = useCart();

  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState("all"); // 'all' or category.id
  const [loadingCats, setLoadingCats] = useState(true);

  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const tabsRef = useRef(null);




  // Optional Lottie empty-state (assets/empty.json). If missing, we’ll show a CSS/SVG fallback.
  const [emptyAnim, setEmptyAnim] = useState(null);
  useEffect(() => {
    import("../assets/empty.json")
      .then((m) => setEmptyAnim(m.default || m))
      .catch(() => setEmptyAnim(null));
  }, []);




  /* 1) Load categories */
  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const q = query(
          collection(db, "productCategories"),
          where("active", "==", true),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCats(rows);
        // default to first category (unless user stays on "all")
        if (rows.length && activeCat === "all") setActiveCat(rows[0].id);
      } finally {
        setLoadingCats(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 2) Load ALL products once (so switching tabs is instant) */
  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      try {
        const q = query(
          collection(db, "products"),
          where("active", "==", true),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllProducts(rows);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  /* 3) Filter by active tab + search + sort */
  const visible = useMemo(() => {
    let arr = allProducts;
    if (activeCat !== "all") {
      arr = arr.filter(p => p.categoryId === activeCat);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(p =>
        (p.title || "").toLowerCase().includes(s) ||
        (p.subtitle || "").toLowerCase().includes(s)
      );
    }
    switch (sort) {
      case "priceLow": arr = [...arr].sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "priceHigh": arr = [...arr].sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      default: arr = [...arr].sort((a, b) => (a.order || 999) - (b.order || 999));
    }
    return arr;
  }, [allProducts, activeCat, search, sort]);

  /* 4) UI */
  return (
    <Page>
      <NoXOverflow />
      {/* search + quick sort */}
      <TopBar>
        <Search>
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item"
            aria-label="Search items"
          />
        </Search>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ border: `1px solid ${TOK.border}`, borderRadius: 12, padding: "8px 10px", background: "#fff" }}
          aria-label="Sort"
        >
          <option value="featured">Featured</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
        </select>
      </TopBar>

      {/* category tabs */}
      <TabsWrap>
        <Tabs ref={tabsRef}>
          <Tab
            $active={activeCat === "all"}
            onClick={() => setActiveCat("all")}
          >
            All
            <Count>{allProducts.length}</Count>
          </Tab>

          {cats.map(c => (
            <Tab
              key={c.id}
              $active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
              aria-label={`Show ${c.displayName || c.title}`}
            >
              {c.displayName || c.title}
              <Count>{allProducts.filter(p => p.categoryId === c.id).length}</Count>
            </Tab>
          ))}
        </Tabs>
      </TabsWrap>

      {/* product grid 
      <Grid>
        {(loadingProducts || loadingCats)
          ? Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><ImgWrap /><Body><Title>&nbsp;</Title></Body></Card>
          ))
          : visible.map(p => {
            const inCart = cart.items.find(x => x.id === p.id);
            const cash = (p.cashbackAmount != null)
              ? p.cashbackAmount
              : Math.round((p.price || 0) * 0.10);

            return (
              <Card key={p.id}>
                <ImgWrap>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.title} loading="lazy" /> : null}
                </ImgWrap>
                <Body>
                  <Title>{p.title}</Title>
                  {p.subtitle ? <Sub>{p.subtitle}</Sub> : null}
                  <PriceRow>
                    {p.mrp ? <span className="mrp">{money(p.mrp)}</span> : null}
                    <span className="price">{money(p.price)}</span>
                  </PriceRow>

                  {!inCart ? (
                    <AddBtn
                      onClick={() =>
                        cart.addItem({
                          id: p.id,
                          title: p.title,
                          price: Number(p.price || 0),
                          imageUrl: p.imageUrl || null,
                          mrp: p.mrp || null,
                          sizeLabel: p.sizeLabel || null,
                          subtitle: p.subtitle || null,
                          cashbackAmount: cash
                        })
                      }
                    >
                      ADD
                    </AddBtn>
                  ) : (
                    <Stepper>
                      <button onClick={() => cart.dec(p.id)} aria-label="Decrease">−</button>
                      <span>{inCart.qty}</span>
                      <button onClick={() => cart.inc(p.id)} aria-label="Increase">+</button>
                    </Stepper>
                  )}

                  <Meta>
                    <div style={{ color: TOK.green, fontWeight: 800 }}>
                      {cash ? `₹ ${cash} Cashback` : ""}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FiStar size={14} /> {(p.rating?.avg ?? 4.8).toFixed(1)} ({p.rating?.count ?? 50})
                    </div>
                  </Meta>
                </Body>
              </Card>
            );
          })
        }
      </Grid>
*/}



      {/* products / skeletons / empty-state */}
      {(loadingProducts || loadingCats) ? (
        <Grid>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><ImgWrap /><Body><Title>&nbsp;</Title></Body></Card>
          ))}
        </Grid>
      ) : visible.length === 0 ? (
        <EmptyWrap>
          <EmptyCard>
            <EmptyAnim>
              {emptyAnim ? (
                <Lottie play loop={false} animationData={emptyAnim} style={{ width: 180, height: 180 }} />
              ) : (
                <EmptyGhost>
                  {/* graceful fallback icon (animated container) */}
                  <svg viewBox="0 0 24 24" fill="none" stroke={TOK.sub} strokeWidth="1.5">
                    <path d="M3 7h18l-1.5 12.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                </EmptyGhost>
              )}
            </EmptyAnim>
            <EmptyTitle>No products here (yet)</EmptyTitle>
            <EmptySub>
              We’re curating this category. Try browsing all items or clearing your search.
            </EmptySub>
            <EmptyActions>
              <PrimaryBtn onClick={() => setActiveCat("all")}>Browse All</PrimaryBtn>
              {search && <EmptyBtn onClick={() => setSearch("")}>Clear Search</EmptyBtn>}
            </EmptyActions>
          </EmptyCard>
        </EmptyWrap>
      ) : (
        <Grid>
          {visible.map((p) => {
            const inCart = cart.items.find((x) => x.id === p.id);
            const cash = (p.cashbackAmount != null)
              ? p.cashbackAmount
              : Math.round((p.price || 0) * 0.10);

            return (
              <Card key={p.id}>
                <ImgWrap>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.title} loading="lazy" /> : null}
                </ImgWrap>
                <Body>
                  <Title>{p.title}</Title>
                  {p.subtitle ? <Sub>{p.subtitle}</Sub> : null}
                  <PriceRow>
                    {p.mrp ? <span className="mrp">{money(p.mrp)}</span> : null}
                    <span className="price">{money(p.price)}</span>
                  </PriceRow>

                  {!inCart ? (
                    <AddBtn
                      onClick={() =>
                        cart.addItem({
                          id: p.id,
                          title: p.title,
                          price: Number(p.price || 0),
                          imageUrl: p.imageUrl || null,
                          mrp: p.mrp || null,
                          sizeLabel: p.sizeLabel || null,
                          subtitle: p.subtitle || null,
                          cashbackAmount: cash,
                        })
                      }
                    >
                      ADD
                    </AddBtn>
                  ) : (
                    <Stepper>
                      <button onClick={() => cart.dec(p.id)} aria-label="Decrease">−</button>
                      <span>{inCart.qty}</span>
                      <button onClick={() => cart.inc(p.id)} aria-label="Increase">+</button>
                    </Stepper>
                  )}

                  <Meta>
                    <div style={{ color: TOK.green, fontWeight: 800 }}>
                      {cash ? `₹ ${cash} Cashback` : ""}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FiStar size={14} /> {(p.rating?.avg ?? 4.8).toFixed(1)} ({p.rating?.count ?? 50})
                    </div>
                  </Meta>
                </Body>
              </Card>
            );
          })}
        </Grid>
      )}


    </Page>
  );
}
