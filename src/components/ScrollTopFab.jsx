// src/components/ScrollTopFab.jsx
import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FiArrowUp } from "react-icons/fi";

const TOK = {
    green: "#5b7c3a",
    greenD: "#48652f",
    on: "#fff",
    ring: "rgba(16,24,40,.12)",
    shadow: "0 12px 26px rgba(0,0,0,.18)",
};

const pop = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: none; }
`;

const Fab = styled.button`
  position: fixed;
  right: max(14px, env(safe-area-inset-right));
  bottom: calc(var(--bottom-nav-offset, 88px) + env(safe-area-inset-bottom));
  z-index: 12000;

  display: grid; place-items: center;
  width: 46px; height: 46px; border-radius: 999px;
  border: 0; cursor: pointer;
  color: ${TOK.on}; background: ${TOK.green};
  box-shadow: ${TOK.shadow};
  outline: 1px solid ${TOK.ring};
  transition: transform .1s ease, background .12s ease, opacity .2s ease;
  animation: ${pop} .18s ease both;

  &:hover { background: ${TOK.greenD}; }
  &:active { transform: translateY(1px); }
  &:focus-visible { outline: 3px solid rgba(91,124,58,.35); outline-offset: 2px; }

  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? "auto" : "none")};
`;

export default function ScrollTopFab({
    /** Show AFTER you've scrolled at least this many px. */
    showAfter = 200,
    /** Optional: ALSO show when within this many px of bottom (set 0/false to disable). */
    revealWithin = 0,
    /** Lift above bottom nav. */
    bottomOffset = 92,
}) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        document.documentElement.style.setProperty("--bottom-nav-offset", `${bottomOffset}px`);

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrollY = window.scrollY || window.pageYOffset || 0;
                const vh = window.innerHeight || 0;
                const docH = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );

                const scrolledDown = scrollY > showAfter;
                const nearBottom =
                    !!revealWithin && docH > vh && scrollY + vh >= docH - revealWithin;

                // show if scrolled down OR (optionally) near bottom
                setShow(scrolledDown || nearBottom);
                ticking = false;
            });
        };

        onScroll(); // initial state
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [showAfter, revealWithin, bottomOffset]);

    const toTop = () => {
        const prefersReduced =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const behavior = prefersReduced ? "auto" : "smooth";
        // try the element that actually scrolls in this browser
        const el =
            document.scrollingElement ||
            document.documentElement ||
            document.body;

        try {
            el.scrollTo({ top: 0, behavior });
        } catch {
            // fallback
            window.scrollTo({ top: 0, behavior });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }
    };

    return (
        <Fab type="button" aria-label="Back to top" title="Back to top" onClick={toTop} $show={show}>
            <FiArrowUp size={20} />
        </Fab>
    );
}
