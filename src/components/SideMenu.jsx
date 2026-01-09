// src/components/SideMenu.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../auth/AuthProvider";
import { FiLink } from "react-icons/fi";
import { SiZoho } from "react-icons/si"; // Zoho icon
import { FiTarget } from "react-icons/fi";

import hdfcLogo from "../assets/hdfc.png";


import {
  FiUsers,
  FiHome,
  FiBox,
  FiShoppingCart,
  FiDollarSign,
  FiBarChart2,
  FiGrid,
  FiPackage,
  FiImage,
  FiExternalLink,
  FiTruck,
  FiMonitor,
  FiChevronDown,
  FiFileText,      // 👈 NEW – for policies section
} from "react-icons/fi";
import PurchasesGroup from "./SideMenuGroups/PurchasesGroup";

/* Quick links UI */
const QuickWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255,255,255,.04);
  border-radius: 12px;
  margin-bottom: 12px;
`;

const QuickHead = styled.button`
  width: 100%;
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 12px; border:0; background:transparent; color:inherit; cursor:pointer;
  font-weight: 800; letter-spacing:.2px;
  .chev{ transition: transform .2s ease; transform: rotate(${p => p.$open ? 180 : 0}deg); opacity:.8; }
`;

const QuickGrid = styled.div`
  overflow:hidden; display:grid; transition:grid-template-rows .22s ease;
  grid-template-rows: ${p => (p.$open ? "1fr" : "0fr")};
`;

const QuickInner = styled.div`
  min-height:0; padding: 0 10px 10px;
  display:flex; flex-wrap:wrap; gap:8px;
`;

const QuickLink = styled(NavLink)`
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  background: rgba(255,255,255,.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: inherit;
  text-decoration: none;

  svg { font-size: 15px; opacity: .9; }

  &.active{ background: rgba(255,255,255,.10); }

  /* ✅ Zoho theming */
  ${({ $variant }) =>
    $variant === "zoho" &&
    `
      border: 1px solid rgba(34,197,94,.35);
      background: linear-gradient(180deg, rgba(34,197,94,.14), rgba(255,255,255,.04));
      box-shadow: 0 0 0 1px rgba(34,197,94,.08) inset;
    `}
`;


/* Main side menu UI */
const Wrap = styled.aside`
  width: 240px;
  padding: 16px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
`;
const TopSingleLink = styled(NavLink)`
  display:flex; align-items:center; gap:10px;
  padding: 10px 12px; margin-bottom: 10px;
  border:1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255,255,255,.04);
  border-radius: 10px; color: inherit; text-decoration: none; font-weight:700;
  &.active{ background: rgba(255,255,255,.08); }
  svg{ font-size:18px; }
`;

const Section = styled.div`margin-bottom: 10px;`;
const SectionHead = styled.button`
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 8px 10px; margin: 6px 0 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255,255,255,.04);
  color: ${({ theme }) => theme.colors.text};
  border-radius: 10px; cursor: pointer;
  .left{ display:flex; align-items:center; gap:10px;
    font-weight:700; font-size:13px; letter-spacing:.3px; text-transform:uppercase;
    color:${({ theme }) => theme.colors.textSubtle}; }
  .chev{ transition: transform .2s ease; transform: rotate(${p => p.$open ? 180 : 0}deg); opacity:.75; }
`;
const ItemsWrap = styled.div`
  overflow: hidden; display: grid; transition: grid-template-rows .22s ease;
  grid-template-rows: ${p => (p.$open ? "1fr" : "0fr")};
`;
const ItemsInner = styled.div`min-height: 0;`;
const Item = styled(NavLink)`
  display:flex; align-items:center; gap:10px;
  padding: 9px 12px 9px 14px; margin:4px 0;
  border-radius: 10px; color: inherit; text-decoration: none; opacity:.95;
  &.active{ background: rgba(255,255,255,.06); opacity:1; }
  svg{ flex:0 0 auto; font-size:18px; }
`;

/* Roles */
const ROLE_ALL = ["owner", "admin", "InventoryManagerAdmin", "OrderManagementAdmin", "BooksAccountsAdmin", "SalesAdmin"];
const ADMIN_CATS = ["owner", "admin", "InventoryManagerAdmin"];
const ADMIN_PROD = ["owner", "admin", "InventoryManagerAdmin", "SalesAdmin"];

/* All links (source of truth) */
const ALL_LINKS = [
  // People/admin-ish
  { key: "users", label: "Users", to: "/admin/users", roles: ["admin", "owner"], icon: FiUsers },
  { key: "adminmobile", label: "Admin Mobile", to: "/admin/whatsappnotifs", roles: ["admin", "owner"], icon: FiUsers },
  { key: "pos", label: "POS", to: "/admin/pos", roles: ["owner", "admin", "SalesAdmin", "InventoryManagerAdmin"], icon: FiMonitor },

  // Core ops
  { key: "dashboard", label: "Dashboard", to: "/admin", roles: ROLE_ALL, icon: FiHome, end: true },
  { key: "inventory", label: "Inventory", to: "/admin/inventory", roles: ["InventoryManagerAdmin", "SalesAdmin", "admin", "owner"], icon: FiBox },
  { key: "orders", label: "Orders", to: "/admin/orders", roles: ["OrderManagementAdmin", "SalesAdmin", "admin", "owner"], icon: FiShoppingCart },
  { key: "accounting", label: "Accounting", to: "/admin/accounting", roles: ["BooksAccountsAdmin", "admin", "owner"], icon: FiDollarSign },
  { key: "sales", label: "Sales", to: "/admin/sales", roles: ["SalesAdmin", "admin", "owner"], icon: FiBarChart2 },

  // UI / site content
  { key: "uiHeader", label: "UI (Header/Carousel)", to: "/admin/ui", roles: ["owner", "admin"], icon: FiImage },
  { key: "uiAbout", label: "UI (About)", to: "/admin/about", roles: ["owner", "admin"], icon: FiImage },
  { key: "uiOffers", label: "UI (Offers)", to: "/admin/offers", roles: ["owner", "admin"], icon: FiImage },
  { key: "uiLogin", label: "UI (Login)", to: "/admin/logincontent", roles: ["owner", "admin"], icon: FiImage },
  { key: "uiTestimonials", label: "UI (Testimonials)", to: "/admin/testimonials", roles: ["owner", "admin"], icon: FiImage },
  { key: "promobanneradmin", label: "UI (Promo Banner)", to: "/admin/promobanneradmin", roles: ["owner", "admin"], icon: FiImage },
  { key: "ourcertsadmin", label: "UI (Certificates)", to: "/admin/ourcertsadmin", roles: ["owner", "admin"], icon: FiImage },
  { key: "whatsapp", label: "UI (WhatsApp)", to: "/admin/whatsapp", roles: ["owner", "admin"], icon: FiImage },

  // Accounting / GST
  { key: "billing", label: "Billing", to: "/admin/billing-config", roles: ["owner", "admin"], icon: FiDollarSign },
  { key: "coa", label: "Chart of Accounts", to: "/admin/coa", roles: ["owner", "admin"], icon: FiDollarSign },
  { key: "JournalViewer", label: "Journal Viewer", to: "/admin/JournalViewer", roles: ["owner", "admin"], icon: FiDollarSign },
  { key: "gst", label: "GST", to: "/admin/gst", roles: ["owner", "admin"], icon: FiDollarSign },
  { key: "financial-statements", label: "Financial Statements", to: "/admin/financial-statements", roles: ["owner", "admin"], icon: FiDollarSign },

  // Integrations / delivery
  { key: "crm", label: "CRM (Embedded)", to: "/admin/crm", roles: ["owner", "admin"], icon: FiExternalLink },
  { key: "deliverySettings", label: "Delivery Settings", to: "/admin/delivery-settings", roles: ["owner", "admin"], icon: FiTruck },
  { key: "deliveryBoys", label: "Delivery Boys", to: "/admin/delivery-boys", roles: ["owner", "admin"], icon: FiUsers },

  // Catalog
  { key: "categories", label: "Categories", to: "/admin/categories", roles: ADMIN_CATS, icon: FiGrid },
  { key: "products", label: "Products", to: "/admin/products", roles: ADMIN_PROD, icon: FiPackage },

  // Partner / suppliers / exports / links
  { key: "partnerrequests", label: "Partner Requests", to: "/admin/partners", roles: ADMIN_PROD, icon: FiPackage },
  // 👇 Terms admin already exists; keep key but we'll also add preview link below in policies
  { key: "terms", label: "Terms & Conditions (Admin)", to: "/admin/terms", roles: ADMIN_PROD, icon: FiFileText },
  { key: "suppliers", label: "Suppliers", to: "/admin/suppliers", roles: ADMIN_PROD, icon: FiPackage },
  { key: "exports", label: "Exports", to: "/admin/exports", roles: ADMIN_PROD, icon: FiPackage },
  { key: "applinks", label: "App Links", to: "/admin/applinks", roles: ADMIN_PROD, icon: FiPackage },

  /* ===== POLICIES & LEGAL (Admin + Preview) ===== */

  // Admin editors
  { key: "refundPolicyAdmin", label: "Refund Policy (Admin)", to: "/admin/refundpolicy", roles: ADMIN_PROD, icon: FiFileText },
  { key: "cancellationPolicyAdmin", label: "Cancellation Policy (Admin)", to: "/admin/cancellation-policy", roles: ADMIN_PROD, icon: FiFileText },
  { key: "contactUsAdmin", label: "Contact Us (Admin)", to: "/admin/contact-us", roles: ADMIN_PROD, icon: FiFileText },
  { key: "aboutUsAdmin", label: "About Us (Admin)", to: "/admin/about", roles: ADMIN_PROD, icon: FiFileText },
  { key: "privacyAdmin", label: "Privacy Policy (Admin)", to: "/admin/privacy", roles: ADMIN_PROD, icon: FiFileText },

  // Public preview pages (openable from admin panel)
  { key: "refundPolicyPage", label: "Refund Policy (Preview)", to: "/refundpolicy", roles: ROLE_ALL, icon: FiFileText },
  { key: "cancellationPolicyPage", label: "Cancellation Policy (Preview)", to: "/cancellation-policy", roles: ROLE_ALL, icon: FiFileText },
  { key: "contactUsPage", label: "Contact Us (Preview)", to: "/contact-us", roles: ROLE_ALL, icon: FiFileText },
  { key: "aboutUsPage", label: "About Us (Preview)", to: "/about", roles: ROLE_ALL, icon: FiFileText },
  { key: "termsPage", label: "Terms & Conditions (Preview)", to: "/terms", roles: ROLE_ALL, icon: FiFileText },
  { key: "privacyPage", label: "Privacy Policy (Preview)", to: "/privacy", roles: ROLE_ALL, icon: FiFileText },
];

/* Section groups (parent menus) */
const SECTIONS = [
  { key: "ops", title: "Operations", icon: FiBox, children: ["pos", "orders", "inventory", "deliverySettings", "deliveryBoys"] },
  { key: "analytics", title: "Analytics", icon: FiBarChart2, children: ["dashboard", "sales"] },
  {
    key: "account",
    title: "Accounting",
    icon: FiDollarSign,
    children: ["coa", "JournalViewer", "gst", "financial-statements", "accounting", "billing"]
  }, // Purchases injected here

  { key: "site", title: "Site & UI", icon: FiImage, children: ["uiHeader", "uiAbout", "uiOffers", "uiLogin", "uiTestimonials", "promobanneradmin", "ourcertsadmin", "whatsapp"] },

  { key: "catalog", title: "Catalog", icon: FiPackage, children: ["categories", "products"] },

  // 👇 People section WITHOUT terms now
  { key: "people", title: "People, Access & links", icon: FiUsers, children: ["users", "adminmobile", "partnerrequests", "suppliers", "exports", "applinks"] },

  // 👇 NEW Policies section (Admin + Preview in one place)
  {
    key: "policies",
    title: "Policies & Legal",
    icon: FiFileText,
    children: [
      // Admin first
      "refundPolicyAdmin",
      "cancellationPolicyAdmin",
      "contactUsAdmin",
      "aboutUsAdmin",
      "terms",
      "privacyAdmin",
      // Then previews
      "refundPolicyPage",
      "cancellationPolicyPage",
      "contactUsPage",
      "aboutUsPage",
      "termsPage",
      "privacyPage",
    ],
  },

  { key: "integr", title: "Integrations", icon: FiExternalLink, children: ["crm"] },
];

export default function SideMenu() {

  const QUICK_LINKS = [
    {
      label: "Zoho Inventory",
      to: "/admin/zoho-inventory",
      roles: ["owner", "admin"],
      icon: SiZoho,
      variant: "zoho",
    },
    {
      label: "Zoho Items",
      to: "/admin/zoho-items",
      roles: ["owner", "admin"],
      icon: SiZoho,
      variant: "zoho",
    },


    // 2) PaymentsAuditDashboard right after Zoho (HDFC theming)
    {
      label: "PaymentAuditDashboard",
      to: "/admin/PaymentAuditDashboard",
      roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"],
      iconImg: hdfcLogo,
      variant: "hdfc",
    },

    // 3) CRM moved to quick links with Target icon
    {
      label: "CRM (Embedded)",
      to: "/admin/crm",
      roles: ["owner", "admin"],
      icon: FiTarget,
    },



    { label: "Categories", to: "/admin/categories", roles: ["owner", "admin", "InventoryManagerAdmin"] },
    { label: "Products", to: "/admin/products", roles: ["owner", "admin", "InventoryManagerAdmin", "SalesAdmin"] },
    { label: "Inventories", to: "/admin/inventory", roles: ["admin", "InventoryManagerAdmin", "SalesAdmin", "owner"] },
    { label: "Vendors", to: "/admin/purchases/vendors", roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"] },
    { label: "Customers", to: "/admin/customers", roles: ["owner", "admin", "SalesAdmin"] },
    { label: "Admins", to: "/admin/users", roles: ["owner", "admin"] },
    { label: "Sales", to: "/admin/sales", roles: ["owner", "admin", "OrderManagementAdmin", "SalesAdmin"] },
    { label: "Purchases", to: "/admin/purchases", roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"] },
    { label: "Income", to: "/admin/accounting", roles: ["owner", "admin", "OrderManagementAdmin", "SalesAdmin", "BooksAccountsAdmin"] },
    { label: "Expenses", to: "/admin/expenses", roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"] },

    { label: "PaymentAuditDashboard", to: "/admin/PaymentAuditDashboard", roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"] },



    { label: "Social links", to: "/admin/social-links", roles: ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"] },

    // 🔹 New Zoho quick links
    // { label: "Connect Zoho", to: "/admin/connect-zoho", roles: ["owner", "admin"] },
    // { label: "Zoho Items", to: "/admin/zoho-items", roles: ["owner", "admin"] },
    // { label: "Zoho Status", to: "/admin/zoho-connected", roles: ["owner", "admin"] },



  ];

  const QUICK_KEY = "admin_quick_links_open";
  const [quickOpen, setQuickOpen] = useState(() => {
    try {
      const v = localStorage.getItem(QUICK_KEY);
      return v === null ? true : JSON.parse(v); // default expanded
    } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem(QUICK_KEY, JSON.stringify(quickOpen)); } catch { }
  }, [quickOpen]);

  const { role, loading } = useAuth();
  const location = useLocation();

  const linksByKey = useMemo(() => {
    const map = new Map();
    ALL_LINKS.forEach(l => map.set(l.key, l));
    return map;
  }, []);

  const filteredSections = useMemo(() => {
    return SECTIONS.map(sec => {
      const items = sec.children
        .map(k => linksByKey.get(k))
        .filter(Boolean)
        .filter(l => l.roles.includes(role));
      return { ...sec, items };
    }).filter(sec => sec.items.length > 0 || sec.key === "account"); // ensure Accounting stays so we can inject Purchases
  }, [role, linksByKey]);

  // open/close state with persistence
  const STORAGE_KEY = "admin_side_menu_open";
  const [open, setOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  });

  // auto-open section containing current route
  useEffect(() => {
    setOpen(prev => {
      const next = { ...prev };
      filteredSections.forEach(sec => {
        if (sec.items.some(i => location.pathname.startsWith(i.to))) next[sec.key] = true;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(open)); } catch { }
  }, [open]);

  if (loading) {
    return (
      <Wrap>
        <div style={{ fontSize: 12, color: "#9aa4b2" }}>Loading…</div>
      </Wrap>
    );
  }

  const canSeePurchases = ["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"].includes(role);

  return (
    <Wrap>

      <QuickWrap>
        <QuickHead onClick={() => setQuickOpen(o => !o)} $open={quickOpen} aria-expanded={quickOpen}>
          <span>Quick links</span>
          <FiChevronDown className="chev" />
        </QuickHead>
        <QuickGrid $open={quickOpen}>
          <QuickInner>
            {/* {QUICK_LINKS
              .filter(q => q.roles.includes(role))
              .map(q => (
                <QuickLink key={q.to} to={q.to} className={({ isActive }) => isActive ? "active" : ""}>
                  {q.label}
                </QuickLink>
              ))} */}

            {/* {QUICK_LINKS
              .filter(q => q.roles.includes(role))
              .map(q => {
                const Icon = q.icon || FiLink;
                return (
                  <QuickLink
                    key={q.to}
                    to={q.to}
                    $variant={q.variant}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    <Icon />
                    {q.label}
                  </QuickLink>
                );
              })} */}



            {QUICK_LINKS
              .filter(q => q.roles.includes(role))
              .map(q => {
                const Icon = q.icon || FiLink;
                return (
                  <QuickLink
                    key={q.to}
                    to={q.to}
                    $variant={q.variant}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {q.iconImg ? (
                      <img
                        src={q.iconImg}
                        alt=""
                        style={{ width: 15, height: 15, borderRadius: 3, opacity: 0.95 }}
                      />
                    ) : (
                      (() => {
                        const Icon = q.icon || FiLink;
                        return <Icon />;
                      })()
                    )}
                    {q.label}
                  </QuickLink>
                );

              })}




          </QuickInner>
        </QuickGrid>
      </QuickWrap>

      <TopSingleLink to="/admin/settings" end>
        <FiGrid />
        <span>Settings</span>
      </TopSingleLink>

      {filteredSections.map(sec => {
        const Icon = sec.icon;
        const isOpen = !!open[sec.key];
        return (
          <Section key={sec.key}>
            <SectionHead
              onClick={() => setOpen(p => ({ ...p, [sec.key]: !p[sec.key] }))}
              $open={isOpen}
              aria-expanded={isOpen}
              aria-controls={`sec-${sec.key}`}
            >
              <div className="left"><Icon />{sec.title}</div>
              <FiChevronDown className="chev" />
            </SectionHead>

            <ItemsWrap id={`sec-${sec.key}`} $open={isOpen}>
              <ItemsInner>
                {sec.items.map(l => {
                  const LIcon = l.icon;
                  return (
                    <Item key={l.to} to={l.to} end={l.end}>
                      <LIcon />
                      <span>{l.label}</span>
                    </Item>
                  );
                })}

                {/* Inject Purchases group under Accounting */}
                {sec.key === "account" && canSeePurchases && (
                  <div style={{ margin: "6px 0 2px" }}>
                    <PurchasesGroup canSee />
                  </div>
                )}
              </ItemsInner>
            </ItemsWrap>
          </Section>
        );
      })}
    </Wrap>
  );
}
