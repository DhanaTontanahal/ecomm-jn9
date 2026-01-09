import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { FiChevronDown, FiX } from "react-icons/fi";

/* ===== Tokens ===== */
const TOK = {
    text: "#1f2937",
    sub: "#6b7280",
    border: "rgba(16,24,40,.12)",
    card: "#fff",
    ring: "rgba(16,24,40,.08)"
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

/* ===== Desktop Dropdown ===== */
const Wrap = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.button`
  appearance: none;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: ${TOK.text};
  font-weight: 700;
  padding: 8px 2px;
  border-bottom: 2px solid transparent;
  &:hover { border-color: ${TOK.text}; }
`;

const Drop = styled.div`
  position: absolute; top: calc(100% + 10px); left: 0;
  background: ${TOK.card};
  border: 1px solid ${TOK.border};
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0,0,0,.12);
  padding: 12px;
  min-width: 560px;
  animation: ${fade} .18s ease both;
  z-index: 60;

  @media (max-width: 919px){ display: none; } /* hidden on mobile */
`;

const Grid = styled.div`
  display: grid; gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (min-width: 1180px){
    grid-template-columns: repeat(4, minmax(0,1fr));
  }
`;

const Cell = styled.button`
  border: 1px solid ${TOK.border};
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: box-shadow .12s ease, transform .08s ease;
  &:hover { box-shadow: 0 8px 18px rgba(0,0,0,.10); transform: translateY(-1px); }
`;

const ImgBox = styled.div`
  aspect-ratio: 4 / 3;
  background: #f3f4f6;
  img { width: 100%; height: 100%; object-fit: cover; display:block; }
`;

const Title = styled.div`
  padding: 8px 10px;
  font-weight: 800;
  color: ${TOK.text};
  font-size: 14px;
`;

/* ===== Mobile Sheet ===== */
const SheetBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: none; z-index: 90;
  @media (max-width: 919px){ display: ${({ $open }) => ($open ? "block" : "none")}; }
`;
const Sheet = styled.div`
  position: fixed; inset: auto 0 0 0;
  background: ${TOK.card};
  border-radius: 14px 14px 0 0;
  border: 1px solid ${TOK.border};
  transform: translateY(${({ $open }) => ($open ? "0" : "100%")});
  transition: transform .22s ease;
  max-height: 88vh; overflow: auto; z-index: 91;
  @media (min-width: 920px){ display: none; }
`;
const SheetHead = styled.div`
  position: sticky; top: 0; background: #fff;
  display:flex; align-items:center; justify-content:space-between;
  border-bottom: 1px solid ${TOK.border};
  padding: 12px 14px;
  h3{ margin:0; font-size: 16px; font-weight: 900; color: ${TOK.text}; }
`;
const MobileGrid = styled.div`
  padding: 12px;
  display: grid; gap: 10px;
  grid-template-columns: repeat(2, minmax(0,1fr));
`;

export default function CategoriesNav({ label = "Products" }) {
    const nav = useNavigate();
    const [cats, setCats] = useState([]);
    const [open, setOpen] = useState(false);          // desktop dropdown
    const [sheetOpen, setSheetOpen] = useState(false); // mobile sheet
    const wrapRef = useRef(null);

    useEffect(() => {
        (async () => {
            const snap = await getDocs(
                query(
                    collection(db, "productCategories"),
                    where("active", "==", true),
                    orderBy("order", "asc")
                )
            );
            setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);

    // close dropdown on outside click (desktop)
    useEffect(() => {
        const onDocClick = (e) => {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const go = (slug) => {
        setOpen(false);
        setSheetOpen(false);
        nav(`/category/${slug}`);
    };

    return (
        <>
            {/* Desktop trigger + dropdown */}
            <Wrap ref={wrapRef}>
                <Trigger
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    onMouseEnter={() => setOpen(true)}
                    aria-expanded={open}
                >
                    {label} <FiChevronDown size={16} />
                </Trigger>

                {open && (
                    <Drop onMouseLeave={() => setOpen(false)}>
                        <Grid>
                            {cats.map(c => (
                                <Cell key={c.id} onClick={() => go(c.slug || c.id)} aria-label={c.displayName || c.title}>
                                    <ImgBox>
                                        {c.imageUrl ? <img src={c.imageUrl} alt={c.displayName || c.title} loading="lazy" /> : null}
                                    </ImgBox>
                                    <Title>{c.displayName || c.title}</Title>
                                </Cell>
                            ))}
                        </Grid>
                    </Drop>
                )}
            </Wrap>

            {/* Mobile trigger — you can place this in the mobile header or drawer */}
            <button
                type="button"
                className="only-mobile-products-trigger"
                onClick={() => setSheetOpen(true)}
                style={{
                    display: "none"
                }}
            />

            {/* Mobile Sheet */}
            <SheetBackdrop $open={sheetOpen} onClick={() => setSheetOpen(false)} />
            <Sheet $open={sheetOpen} onClick={(e) => e.stopPropagation()}>
                <SheetHead>
                    <h3>Browse Categories</h3>
                    <button
                        aria-label="Close"
                        onClick={() => setSheetOpen(false)}
                        style={{ appearance: "none", border: 0, background: "transparent", cursor: "pointer" }}
                    >
                        <FiX />
                    </button>
                </SheetHead>

                <MobileGrid>
                    {cats.map(c => (
                        <Cell key={c.id} onClick={() => go(c.slug || c.id)} aria-label={c.displayName || c.title}>
                            <ImgBox>
                                {c.imageUrl ? <img src={c.imageUrl} alt={c.displayName || c.title} loading="lazy" /> : null}
                            </ImgBox>
                            <Title>{c.displayName || c.title}</Title>
                        </Cell>
                    ))}
                </MobileGrid>
            </Sheet>
        </>
    );
}
