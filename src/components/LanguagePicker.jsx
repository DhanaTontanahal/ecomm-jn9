import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FiChevronDown } from "react-icons/fi";
import { useLang } from "../i18n/LanguageProvider";

const Wrap = styled.div`
  position: relative;
`;

const Button = styled.button`
  border: 1px solid ${({ theme }) => theme.colors?.border || "#e5e7eb"};
  background: #fff;
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 800;
`;

const Drop = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: #fff;
  border: 1px solid ${({ theme }) => theme.colors?.border || "#e5e7eb"};
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(0,0,0,.08);
  padding: 6px;
  z-index: 1000;
  min-width: 160px;
`;

const Option = styled.button`
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  &:hover { background: #f6f7f8; }
`;

const LABELS = { en: "English", hi: "हिंदी", te: "తెలుగు" };

export default function LanguagePicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <Wrap ref={ref}>
      <Button onClick={() => setOpen(v => !v)}>
        {LABELS[lang]} <FiChevronDown size={16} />
      </Button>
      {open && (
        <Drop>
          {Object.entries(LABELS).map(([code, label]) => (
            <Option key={code} onClick={() => { setLang(code); setOpen(false); }}>
              {label}
            </Option>
          ))}
        </Drop>
      )}
    </Wrap>
  );
}
