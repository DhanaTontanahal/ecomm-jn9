import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LangContext = createContext();

const DEFAULT_LANG = "en"; // "en" | "hi" | "te"

// Minimal dictionary — add more keys as you need.
const DICT = {
  en: {
    SHOP: "SHOP",
    YOUR_PROFILE: "Your Profile",
    ADD_NEW: "Add New",
    ADD_DELIVERY_ADDRESS: "Add Delivery Address",
    FULL_NAME: "Full name",
    PHONE: "Phone number",
    LINE1: "House / Flat / Street (Line 1)",
    LINE2: "Area / Locality (Line 2) — optional",
    LANDMARK: "Landmark — optional",
    CITY: "City",
    PINCODE: "Pincode",
    TAG: "Tag",
    HOME: "Home",
    WORK: "Work",
    OTHER: "Other",
    SAVE: "Save Address",
    CANCEL: "Cancel",
    NOT_LOGGED_IN: "You're not logged in.",
    LOGIN: "Login",
    MY_ORDERS: "My Orders",
    BROWSE_CATEGORIES: "Browse Categories",
    CART: "Cart",
  },
  hi: {
    SHOP: "खरीदें",
    YOUR_PROFILE: "आपकी प्रोफ़ाइल",
    ADD_NEW: "नया जोड़ें",
    ADD_DELIVERY_ADDRESS: "डिलीवरी पता जोड़ें",
    FULL_NAME: "पूरा नाम",
    PHONE: "फ़ोन नंबर",
    LINE1: "मकान/फ्लैट/सड़क (लाइन 1)",
    LINE2: "क्षेत्र/लोकैलिटी (लाइन 2) — वैकल्पिक",
    LANDMARK: "लैंडमार्क — वैकल्पिक",
    CITY: "शहर",
    PINCODE: "पिनकोड",
    TAG: "टैग",
    HOME: "घर",
    WORK: "काम",
    OTHER: "अन्य",
    SAVE: "पता सहेजें",
    CANCEL: "रद्द करें",
    NOT_LOGGED_IN: "आप लॉग इन नहीं हैं।",
    LOGIN: "लॉगिन",
    MY_ORDERS: "मेरे ऑर्डर्स",
    BROWSE_CATEGORIES: "श्रेणियाँ देखें",
    CART: "कार्ट",
  },
  te: {
    SHOP: "షాప్",
    YOUR_PROFILE: "మీ ప్రొఫైల్",
    ADD_NEW: "కొత్తది జోడించు",
    ADD_DELIVERY_ADDRESS: "డెలివరి చిరునామా జోడించండి",
    FULL_NAME: "పూర్తి పేరు",
    PHONE: "ఫోన్ నంబర్",
    LINE1: "ఇల్లు / ఫ్లాట్ / వీధి (లైన్ 1)",
    LINE2: "ప్రాంతం / లోకాలిటీ (లైన్ 2) — ఐచ్చికం",
    LANDMARK: "ల్యాండ్‌మార్క్ — ఐచ్చికం",
    CITY: "నగరం",
    PINCODE: "పిన్‌కోడ్",
    TAG: "ట్యాగ్",
    HOME: "ఇల్లు",
    WORK: "ఆఫీస్",
    OTHER: "ఇతర",
    SAVE: "చిరునామా సేవ్ చేయండి",
    CANCEL: "రద్దు",
    NOT_LOGGED_IN: "మీరు లాగిన్ కాలేదు.",
    LOGIN: "లాగిన్",
    MY_ORDERS: "నా ఆర్డర్లు",
    BROWSE_CATEGORIES: "కేటగిరీలు చూడండి",
    CART: "కార్ట్",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || DEFAULT_LANG);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    // update <html lang="">
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
    }
  }, [lang]);

  const t = useMemo(() => {
    const table = DICT[lang] || DICT[DEFAULT_LANG];
    return (key) => table[key] ?? key; // fallback to key
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, DICT }), [lang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
