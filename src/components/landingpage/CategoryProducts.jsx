import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useCart } from "../../cart/CartContext";
import { FiShoppingBag } from "react-icons/fi";
import { FiChevronDown, FiStar, FiSearch, FiHome, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/* ===== UI Tokens (mobile-first) ===== */
const TOK = {
  bg: "#ffffff",
  text: "#111827",
  subtext: "#6b7280",
  border: "rgba(16,24,40,.10)",
  green: "#5b7c3a",
  greenDark: "#48652f",
  priceStrike: "#9ca3af",
  chip: "#dfe8d5",
  saleBadge: "#f59e0b",
  card: "#ffffff",
  shimmerA: "#f3f4f6",
};

const fade = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}`;

const EmptyWrap = styled.div`
  max-width: 720px;
  margin: 24px auto;
  padding: clamp(14px, 4vw, 24px);
  border: 1px dashed ${TOK.border};
  border-radius: 16px;
  background: #fff;
  text-align: center;
  box-shadow: 0 8px 22px rgba(16,24,40,.04);
  animation: ${fade} .25s ease both;
`;

const EmptyIcon = styled.div`
  width: 56px; height: 56px;
  margin: 0 auto 12px;
  border-radius: 999px;
  background: ${TOK.chip};
  display: grid; place-items: center;
  svg { width: 26px; height: 26px; color: ${TOK.green}; }
`;

const EmptyTitle = styled.h3`
  margin: 6px 0 4px;
  font-size: clamp(16px, 5vw, 20px);
  font-weight: 900;
  color: ${TOK.text};
`;

const EmptySub = styled.p`
  margin: 0 auto 14px;
  max-width: 520px;
  color: ${TOK.subtext};
  font-size: clamp(12px, 3.4vw, 14px);
  line-height: 1.5;
`;

const EmptyTips = styled.ul`
  margin: 10px auto 16px; padding-left: 18px; text-align: left;
  max-width: 520px; color: ${TOK.subtext}; font-size: 13px;
  li { margin: 6px 0; }
`;

const EmptyActions = styled.div`
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
`;

const PrimaryBtn = styled.button`
  border: 0;
  background: ${TOK.green};
  color: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  letter-spacing: .2px;
  cursor: pointer;
`;

const GhostBtn = styled.button`
  border: 1px solid ${TOK.border};
  background: #fff;
  color: ${TOK.text};
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
`;


const Wrap = styled.div`
  background:${TOK.bg};
  padding: clamp(10px, 3.8vw, 18px);
  min-height: 70vh;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* contain layout to avoid stray overflow on tiny screens */
  &, * { min-width: 0; box-sizing: border-box; }
`;

const HeaderRow = styled.div`
  max-width: 1280px; margin: 0 auto 10px;
  display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;

  h1 {
    margin: 0;
    color: ${TOK.text};
    font-weight: 800;
    /* compact but readable on phones, scales up on tablets/desktop */
    font-size: clamp(16px, 5.2vw, 24px);
    line-height: 1.15;
  }
  .count {
    color:${TOK.subtext};
    font-size: clamp(11px, 3.2vw, 12px);
    font-weight: 600;
  }
`;

const Toolbar = styled.div`
  max-width: 1280px; margin: 0 auto 12px;
  /* Wrap into new lines instead of scrolling horizontally */
  display: flex; flex-wrap: wrap; gap: 8px;
`;

const Pill = styled.button`
  appearance: none;
  border:1px solid ${TOK.border};
  background:#fff;
  color:${TOK.text};
  border-radius: 999px;
  padding: 8px 10px;
  display:flex; align-items:center; gap:6px;
  cursor:pointer;
  height: 36px;
  font-size: clamp(12px, 3.2vw, 13px);
  line-height: 1;
`;

const SelectInline = styled.select`
  border:1px solid ${TOK.border};
  background:#fff;
  color:${TOK.text};
  border-radius:999px;
  padding: 8px 10px;
  height: 36px;
  font-size: clamp(12px, 3.2vw, 13px);
`;

/* Grid: 1 → 2 → 3 → 4 columns gradually */
const Grid = styled.div`
  max-width: 1280px; margin: 0 auto;
  display:grid; gap: 10px;
  grid-template-columns: 1fr;
  @media (min-width: 420px){ grid-template-columns: repeat(2, minmax(0,1fr)); }
  @media (min-width: 840px){ grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
  @media (min-width: 1200px){ grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
`;

const Card = styled.div`
  border:1px solid ${TOK.border};
  border-radius: 14px;
  background:${TOK.card};
  overflow:hidden;
  box-shadow: 0 6px 14px rgba(16,24,40,.06);
  animation:${fade} .28s ease both;
`;

const ImgWrap = styled.div`
  /* square images feel app-like and avoid tall scroll */
  aspect-ratio: 1 / 1;
  background:${TOK.shimmerA};
  position:relative; display:grid; place-items:center;

  img{
    width:100%; height:100%;
    object-fit: contain;
  }
`;

const SaleBadge = styled.div`
  position:absolute; top:8px; left:8px;
  background:${TOK.saleBadge}; color:#fff;
  padding:5px 7px; border-radius:8px;
  font-weight:800; font-size: 11px;
`;

const SizeChip = styled.div`
  position:absolute; right:8px; bottom:8px;
  background:${TOK.chip}; color:${TOK.text};
  padding:6px 8px; border-radius:10px; font-weight:800; font-size:12px;
`;

const Body = styled.div`
  padding: 10px 10px 12px;
`;

const Title = styled.div`
  color:${TOK.text}; font-weight: 800;
  font-size: clamp(14px, 4vw, 16px);
  display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
`;

const Sub = styled.div`
  margin-top: 2px; color:${TOK.subtext};
  font-size: clamp(11px, 3.2vw, 12px);
  display:-webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
`;

const PriceRow = styled.div`
  margin-top:6px; display:flex; align-items:baseline; gap:8px;
  .mrp{color:${TOK.priceStrike}; text-decoration:line-through; font-size: 12px;}
  .price{color:${TOK.text}; font-weight: 900; font-size: clamp(16px, 4.6vw, 18px);}
`;

const AddBtn = styled.button`
  width:100%; margin-top:10px; height:44px;
  border:none; border-radius:12px;
  background:${TOK.green}; color:#fff; font-weight:900; letter-spacing:.2px;
  cursor:pointer; transition: transform .05s ease;
  &:active{ transform: translateY(1px); }
`;

const QtyGroup = styled.div`
  display:flex; align-items:center; gap:8px; margin-top:10px;
`;

const Stepper = styled.div`
  display:inline-flex; align-items:center;
  border:1px solid ${TOK.border}; border-radius:12px; overflow:hidden;
  button{
    width:40px; height:40px; border:0; background:#fff; font-size:20px; line-height:0; cursor:pointer;
  }
  span{ min-width:34px; text-align:center; font-weight:900; font-size:14px; }
`;

const LineTotal = styled.div`
  margin-left:auto; font-weight:900; font-size:14px;
`;

const MetaRow = styled.div`
  margin-top:8px; display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:${TOK.subtext};
  .cash{color:${TOK.green}; font-weight:800;}
  .rating{display:flex; align-items:center; gap:6px;}
`;


// 1) Add styles (below your other styled components)
const CartFabWrap = styled.div`
  position: fixed;
  left: 12px;
  bottom: 14px;
  z-index: 1000;

  @media (min-width: 920px) {
    bottom: auto;
    top: 50%;
    transform: translateY(-50%);
    left: 18px;
  }
`;

const CartFabBtn = styled.button`
  appearance: none;
  border: 0;
  background: #fff;
  color: ${TOK.text};
  width: 56px;
  height: 56px;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.16), 0 2px 6px rgba(16, 24, 40, 0.08);
  border: 1px solid ${TOK.border};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;

  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }

  svg { width: 22px; height: 22px; }
`;

const CartFabBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: ${TOK.green};
  color: #fff;
  font-weight: 900;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(91,124,58,.35);
`;

// Optional helper if you want a subtle pulse when items > 0
const pulse = keyframes`
  0% { transform: scale(1); } 
  50% { transform: scale(1.06); } 
  100% { transform: scale(1); }
`;
const CartFabGlow = styled.div`
  position: absolute; inset: 0;
  border-radius: 999px;
  animation: ${p => p.$pulse ? pulse : "none"} 1.2s ease-in-out infinite;
  pointer-events: none;
`;


/* ===== helpers ===== */
const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;
const pctOff = (mrp, price) => {
  const m = Number(mrp || 0), p = Number(price || 0);
  if (!m || !p || p >= m) return 0;
  return Math.round(((m - p) / m) * 100);
};

export default function CategoryProducts() {
  const nav = useNavigate();

  const { slug } = useParams();
  const cart = useCart();

  const [cat, setCat] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cs = await getDocs(query(collection(db, "productCategories"), where("slug", "==", slug)));
        if (cs.empty) { setCat(null); setItems([]); return; }
        const c = { id: cs.docs[0].id, ...cs.docs[0].data() };
        setCat(c);

        const ps = await getDocs(query(
          collection(db, "products"),
          where("categoryId", "==", c.id),
          where("active", "==", true),
          orderBy("order", "asc")
        ));
        setItems(ps.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [slug]);


  const clearAllFilters = () => {
    setInStockOnly(false);
    setPriceMin("");
    setPriceMax("");
    setSort("featured");
  };

  const filteredSorted = useMemo(() => {
    let arr = [...items];
    if (inStockOnly) arr = arr.filter(p => (p.stock ?? 0) > 0);

    const min = Number(priceMin || 0), max = Number(priceMax || 0);
    if (priceMin !== "" || priceMax !== "") {
      arr = arr.filter(p => {
        const price = Number(p.price || 0);
        if (priceMin !== "" && price < min) return false;
        if (priceMax !== "" && price > max) return false;
        return true;
      });
    }

    switch (sort) {
      case "priceLow": arr.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "priceHigh": arr.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "discount": arr.sort((a, b) => pctOff(b.mrp, b.price) - pctOff(a.mrp, a.price)); break;
      case "popular": arr.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0)); break;
      default: arr.sort((a, b) => (a.order || 999) - (b.order || 999));
    }
    return arr;
  }, [items, inStockOnly, priceMin, priceMax, sort]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 919px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 919px)");
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
    };
  }, []);

  console.log("===========In Customer UI============")
  console.log(items)
  return (
    <Wrap>
      <HeaderRow>
        <div>
          <h1>{cat?.displayName || cat?.title || "Products"}</h1>
          <div className="count">{filteredSorted.length} products</div>
        </div>
        <SelectInline value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="discount">Biggest Discount</option>
          <option value="popular">Popularity</option>
        </SelectInline>
      </HeaderRow>

      <Toolbar>
        <Pill onClick={() => setInStockOnly(v => !v)} aria-pressed={inStockOnly}>
          <FiChevronDown size={14} /> {inStockOnly ? "In stock only" : "Availability: All"}
        </Pill>

        <Pill as="div" aria-label="Price filter">
          Price:&nbsp;
          <input
            type="number" inputMode="numeric" placeholder="Min" value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            style={{ width: 72, padding: "6px 8px", border: `1px solid ${TOK.border}`, borderRadius: 8 }}
          />
          &nbsp;–&nbsp;
          <input
            type="number" inputMode="numeric" placeholder="Max" value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            style={{ width: 72, padding: "6px 8px", border: `1px solid ${TOK.border}`, borderRadius: 8 }}
          />
        </Pill>
      </Toolbar>

      <Grid>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (<Card key={i}><ImgWrap /><Body /></Card>))
          : filteredSorted.map(p => {
            const off = pctOff(p.mrp, p.price);
            const cash = (p.cashbackAmount != null)
              ? p.cashbackAmount
              : Math.round((p.price || 0) * 0.10);

            const inCart = cart.items.find(x => x.id === p.id);

            return (
              <Card key={p.id}>
                <ImgWrap>
                  {off > 0 && <SaleBadge>{off}% offs</SaleBadge>}
                  {p.sizeLabel && <SizeChip>{p.sizeLabel}</SizeChip>}
                  {p.imageUrl
                    ? <img
                      src={p.imageUrl}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 420px) 100vw, (max-width: 840px) 50vw, 33vw"
                    />
                    : null}
                </ImgWrap>

                <Body>
                  <Title>{p.title}</Title>
                  <Sub>{p.subtitle}</Sub>

                  <Sub>ItemID {p.zohoItemId}</Sub>

                  <PriceRow>
                    {p.mrp ? <span className="mrp">{money(p.mrp)}</span> : null}
                    <span className="price">{money(p.price)}</span>
                  </PriceRow>


                  {!inCart ? (
                    <AddBtn
                      onClick={() => cart.addItem({
                        id: p.id,
                        title: p.title,
                        price: Number(p.price || 0),
                        imageUrl: p.imageUrl || null,
                        mrp: p.mrp || null,
                        sizeLabel: p.sizeLabel || null,
                        subtitle: p.subtitle || null,
                        cashbackAmount: cash
                      })}
                    >
                      ADD
                    </AddBtn>
                  ) : (
                    <QtyGroup>
                      <Stepper>
                        <button onClick={() => cart.dec(p.id)} aria-label="Decrease">−</button>
                        <span style={{ color: 'black', fontWeight: 'bold' }}>{inCart.qty}</span>
                        <button onClick={() => cart.inc(p.id)} aria-label="Increase">+</button>
                      </Stepper>
                      <LineTotal style={{ color: 'black', fontWeight: 'bold' }}>{money((p.price || 0) * inCart.qty)}</LineTotal>
                    </QtyGroup>
                  )}

                  <MetaRow>
                    <div className="cash">{cash ? `₹ ${cash} Cashback` : ""}</div>
                    <div className="rating">
                      <FiStar size={14} /> {(p.rating?.avg ?? 4.8).toFixed(1)} ({p.rating?.count ?? 50})
                    </div>
                  </MetaRow>
                </Body>
              </Card>
            );
          })
        }
      </Grid>





      {loading ? (
        <Grid>
          {Array.from({ length: 8 }).map((_, i) => (<Card key={i}><ImgWrap /><Body /></Card>))}
        </Grid>
      ) : filteredSorted.length === 0 ? (
        <EmptyWrap>
          <EmptyIcon><FiSearch /></EmptyIcon>
          <EmptyTitle>Nothing here… yet</EmptyTitle>
          <EmptySub>
            We couldn’t find any products in this category with the selected filters.
          </EmptySub>
          <EmptyTips>
            <li>Try clearing price or availability filters.</li>
            <li>Browse other categories from the menu.</li>
          </EmptyTips>
          <EmptyActions>
            <PrimaryBtn onClick={clearAllFilters}>
              <FiRefreshCw /> Clear filters
            </PrimaryBtn>
            <GhostBtn onClick={() => nav("/")}>
              <FiHome /> Go to Home
            </GhostBtn>
          </EmptyActions>
        </EmptyWrap>
      ) : (
        <Grid>
          {filteredSorted.map(p => {
            // … your existing product card render …
          })}
        </Grid>
      )}

















      {
        !isMobile && (<CartFabWrap>
          <CartFabBtn
            aria-label="Open cart"
            onClick={() => cart?.openCart?.()}
            title="Cart"
          >
            <CartFabGlow $pulse={(cart?.totalQty ?? 0) > 0} />
            <FiShoppingBag />
            {(cart?.totalQty ?? 0) > 0 && (
              <CartFabBadge>{cart.totalQty}</CartFabBadge>
            )}
          </CartFabBtn>
        </CartFabWrap>)
      }

    </Wrap>
  );
}
