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

export default function LandingPage() {
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
            <SiteFooter />

            {/* Floating chat -> WA */}
            <WhatsappChatFab
                bottomOffset={92}   // matches your bottom tab height so it doesn't overlap
            />
        </>
    );
}
