// src/pages/LandingPage.jsx
import React from "react";
import HeaderWithCarousel from "../components/HeaderWithCarousel";
import ShopToMakeADifference from "../components/landingpage/ShopToMakeADifference";
import ProductCategories1 from "../components/landingpage/ProductCategories1";
import PromoBannerCountdown from "../components/landingpage/PromoBannerCountdown";
import WeBelieveIn from "../components/landingpage/WeBelieveIn";
import Testimonials from "../components/landingpage/Testimonials";
import OurCertifications from "../components/landingpage/OurCertifications";
import SiteFooter from "../components/landingpage/SiteFooter";
import WhatsappChatFab from "../components/WhatsappChatFab";

import {
    FiFileText,
    FiShield,
    FiInfo,
    FiPhoneCall,
} from "react-icons/fi";

export default function LandingPage() {
    const policyLinks = [
        { label: "Refund Policy", to: "/refundpolicy", icon: <FiFileText /> },
        { label: "Cancellation Policy", to: "/cancellation-policy", icon: <FiFileText /> },
        { label: "Contact Us", to: "/contact-us", icon: <FiPhoneCall /> },
        { label: "About Us", to: "/about", icon: <FiInfo /> },
        { label: "Terms & Conditions", to: "/terms", icon: <FiFileText /> },
        { label: "Privacy Policy", to: "/privacy", icon: <FiShield /> },
    ];

    return (
        <>
            <HeaderWithCarousel />

            <ProductCategories1 linkBase="/category" />
            <ShopToMakeADifference />
            <PromoBannerCountdown
                offerText="Upto 20% OFF"
                subText="FLAT 10% off + 10% Cashback"
                hashtag="#consciousnavratri"
            />
            <WeBelieveIn />
            <Testimonials />
            <OurCertifications />

            {/* ✅ Footer with Policy Links */}
            <SiteFooter policyLinks={policyLinks} />

            {/* ✅ Floating WhatsApp */}
            <WhatsappChatFab bottomOffset={92} />
        </>
    );
}
