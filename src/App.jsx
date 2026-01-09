// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import MarketingWhatsApp from "./pages/MarketingWhatsApp";

import RoleGuard from "./components/RoleGuard";

import PublicLayout from "./layout/PublicLayout";
import PublicMainLayout from "./layout/PublicMainLayout";

import LandingPage from "./pages/LandingPage";
import Sales from "./pages/Sales"
import CategoryProducts from "./components/landingpage/CategoryProducts";

// ADMIN
import AdminCategoryManager from "./components/landingpage/AdminCategoryManager";
import AdminProductManager from "./components/admin/AdminProductManager";
import AdminUserManager from "./components/admin/AdminUserManager";
import AdminHeaderCarouselManager from "./components/admin/AdminHeaderCarouselManager";
import AdminAboutUsEditor from "./components/admin/AdminAboutUsEditor";



// PUBLIC PAGES
import AboutUs from "./pages/AboutUs";
import AdminOffersManager from "./components/admin/AdminOffersManager";
import OffersSection from "./components/OffersSection";
import LoginPageEditor from "./admin/LoginPageEditor";
import AdminTestimonialsManager from "./components/admin/AdminTestimonialsManager";
import AdminCertificationsManager from "./components/admin/AdminCertificationsManager";

import PublicMenu from "./pages/PublicMenu";
import PublicOrders from "./pages/PublicOrders";
import PayBill from "./pages/PayBill";

import AdminMobileNumbers from "./components/admin/AdminMobileNumbers";
import SalesDesk from "./components/SalesDeck";
// import Accounting from "./components/admin/Accounting";
import Dashboard from "./components/admin/Dashboard";
import BillConfig from "./components/admin/BillConfig";

import InvoicePrintByRoute from "./components/admin/InvoicePrintByRoute";
import CrmEmbed from "./pages/CrmEmbed";
import AdminDeliverySettings from "./admin/AdminDeliverySettings";
import DeliveryBoyManager from "./admin/DeliveryBoyManager";
import POS from "./pages/POS";
import Accounting from "./pages/Accounting";
import Vendors from "./pages/purchases/Vendors";
import PurchaseOrders from "./pages/purchases/PurchaseOrders";
import Bills from "./pages/purchases/Bills";
import Expenses from "./pages/purchases/Expenses";
import RecurringExpenses from "./pages/purchases/RecurringExpenses";
import VendorPayments from "./pages/purchases/VendorPayments";
import VendorCredits from "./pages/purchases/VendorCredits";
import Settings from "./pages/settings/Settings";
import Customers from "./pages/Customers";
import PurchasesHome from "./pages/purchases/PurchasesHome";
import PromoBannerAdmin from "./components/admin/PromoBannerAdmin";
import OurCertificationsAdmin from "./components/admin/OurCertificationsAdmin";
import PublicOrderDetails from "./pages/PublicOrderDetails";
import SearchResults from "./pages/SearchResults";
import AdminWhatsappSettings from "./components/admin/AdminWhatsappSettings";
import MyAccountPage from "./pages/MyAccountPage";
import DeliveryAddressesPage from "./pages/DeliveryAddressesPage";
import Privacy from "./pages/Privacy";
import PrivacyAdmin from "./admin/PrivacyAdmin";
import ReferAndEarn from "./pages/ReferAndEarn";
import BecomeBusinessPartner from "./pages/BecomeBusinessPartner";
import AdminBusinessPartners from "./admin/AdminBusinessPartners";
import ExportEnquiry from "./pages/ExportEnquiry";
import Terms from "./pages/Terms";
import BecomeSupplierAdmin from "./admin/BecomeSupplierAdmin";
import BecomeSupplier from "./pages/BecomeSupplier";
import TermsPage from "./pages/TermsPage";
import TermsAdmin from "./admin/TermsAdmin";
import AdminExportEnquiries from "./pages/AdminExportEnquiries";
import ExportEnquiryPage from "./pages/ExportEnquiryPage";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import JournalViewer from "./pages/JournalViewer";
import GstDashboard from "./pages/GstDashboard";
import FinancialStatements from "./pages/FinancialStatements";
import DeliveryAgentOrders from "./pages/DeliveryAgentOrders";
import EcommerceSoftwareShowcase from "./components/EcommerceSoftwareShowcase";
import AdminAppLinksSettings from "./components/admin/AdminAppLinksSettings";
import RefundPolicyAdmin from "./admin/RefundPolicyAdmin";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import CancellationPolicyPage from "./pages/CancellationPolicyPage";
import ContactUsPage from "./pages/ContactUsPage";
import CancellationPolicyAdmin from "./admin/CancellationPolicyAdmin";
import ContactUsAdmin from "./admin/ContactUsAdmin";
import PaymentStatus from "./pages/PaymentStatus";
import AdminSocialLinks from "./pages/AdminSocialLinks";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import PaymentAuditDashboard from "./pages/PaymentAuditDashboard";
import ZohoItemsPage from "./pages/ZohoItemsPage";
import ZohoConnectedPage from "./pages/ZohoConnectedPage";
import ConnectZoho from "./pages/ConnectZoho";
import ZohoInventoryIframe from "./pages/ZohoInventoryIframe";

// Modules that can view the admin Dashboard
const ALL = ["admin", "InventoryManagerAdmin", "OrderManagementAdmin", "BooksAccountsAdmin", "SalesAdmin"];

// Fine-grained admin permissions
const ADMIN_CATEGORIES = ["owner", "admin", "InventoryManagerAdmin"];
const ADMIN_PRODUCTS = ["owner", "admin", "InventoryManagerAdmin", "SalesAdmin"];

export default function App() {
  return (
    <Routes>
      {/* PUBLIC (PublicMainLayout) */}
      <Route path="/" element={<PublicMainLayout><LandingPage /></PublicMainLayout>} />
      <Route path="/login" element={<PublicMainLayout><Login /></PublicMainLayout>} />
      <Route path="/menu" element={<PublicMainLayout><PublicMenu /></PublicMainLayout>} />
      <Route path="/my-orders" element={<PublicMainLayout><PublicOrders /></PublicMainLayout>} />
      <Route path="/pay-bill" element={<PublicMainLayout><PayBill /></PublicMainLayout>} />
      <Route path="/my-orders/:id" element={<PublicOrderDetails />} />
      <Route path="/search" element={<SearchResults />} />

      <Route path="/category/:slug" element={<PublicMainLayout><CategoryProducts /></PublicMainLayout>} />
      <Route path="/about" element={<PublicMainLayout><AboutUs /></PublicMainLayout>} />
      <Route path="/offers" element={<PublicMainLayout><OffersSection title="OFFERS" /></PublicMainLayout>} />
      <Route path="/addresses" element={<DeliveryAddressesPage />} />

      <Route path="/privacy" element={<Privacy />} />
      <Route path="/export" element={<ExportEnquiryPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/refundpolicy" element={<RefundPolicyPage />} />

      <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
      <Route path="/contact-us" element={<ContactUsPage />} />



      <Route path="/refer" element={<ReferAndEarn />} />
      <Route path="/become-supplier" element={<BecomeSupplier />} />
      <Route path="/become-business-partner" element={<BecomeBusinessPartner />} />


      {/* PUBLIC (PublicLayout) — consider removing duplicates to avoid route conflicts */}
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />

      <Route path="/showcase" element={<PublicLayout><EcommerceSoftwareShowcase /></PublicLayout>} />

      <Route
        path="/delivery/my-orders"
        element={
          <DeliveryAgentOrders
          />
        }
      />


      {/* <Route path="/payment-status" element={<PaymentStatus />} /> */}
      <Route path="/payment-status" element={<PaymentStatusPage />} />



      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/category/:slug" element={<PublicLayout><CategoryProducts /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutUs /></PublicLayout>} />
      <Route path="/offers" element={<PublicLayout><OffersSection title="OFFERS" /></PublicLayout>} />
      <Route path="/accounts" element={<PublicLayout><MyAccountPage title="Account" /></PublicLayout>} />
      {/* ADMIN APP (requires login + role) */}
      <Route path="/admin/invoice/:invoiceId" element={<InvoicePrintByRoute />} />

      <Route path="/admin" element={<AppLayout />}>
        {/* Dashboard */}
        <Route
          index
          element={
            <RoleGuard allow={ALL}>
              <Dashboard />
            </RoleGuard>
          }
        />

        <Route path="MarketingWhatsApp" element={<MarketingWhatsApp />} />

        <Route path="/admin/social-links" element={<AdminSocialLinks />} />


        <Route path="/admin/cancellation-policy" element={<CancellationPolicyAdmin />} />
        <Route path="/admin/contact-us" element={<ContactUsAdmin />} />




        <Route path="PaymentAuditDashboard" element={<PaymentAuditDashboard />} />

        <Route path="privacy" element={<PrivacyAdmin />} />
        <Route path="terms" element={<TermsAdmin />} />
        <Route path="refundpolicy" element={<RefundPolicyAdmin />} />
        <Route path="partners" element={<AdminBusinessPartners />} />
        <Route path="suppliers" element={<BecomeSupplierAdmin />} />
        <Route path="exports" element={<AdminExportEnquiries />} />

        <Route path="applinks" element={<AdminAppLinksSettings />} />

        <Route path="whatsapp" element={<AdminWhatsappSettings />} />

        <Route path="promobanneradmin" element={<PromoBannerAdmin />} />

        <Route path="ourcertsadmin" element={<OurCertificationsAdmin />} />

        <Route path="zoho-items" element={<ZohoItemsPage />} />
        <Route path="zoho-connected" element={<ZohoConnectedPage />} />
        <Route path="connect-zoho" element={<ConnectZoho />} />

        <Route
          path="zoho-inventory"
          element={<ZohoInventoryIframe />}
        />



        <Route path="purchases/vendors" element={<Vendors />} />
        <Route path="purchases/purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchases/bills" element={<Bills />} />

        <Route path="purchases/expenses" element={<Expenses />} />
        <Route path="purchases/recurring-expenses" element={<RecurringExpenses />} />
        <Route path="purchases/payments-made" element={<VendorPayments />} />
        <Route path="purchases/vendor-credits" element={<VendorCredits />} />

        <Route path="settings" element={<Settings />} />


        {/* Admin: WhatsApp mobile numbers */}
        <Route
          path="whatsappnotifs"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminMobileNumbers />
            </RoleGuard>
          }
        />

        {/* Billing config */}
        <Route
          path="billing-config"
          element={
            <RoleGuard allow={["owner", "admin", "BooksAccountsAdmin"]}>
              <BillConfig />
            </RoleGuard>
          }
        />

        {/* Offers manager */}
        <Route
          path="offers"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminOffersManager />
            </RoleGuard>
          }
        />

        {/* CRM embed */}
        <Route
          path="crm"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <CrmEmbed />
            </RoleGuard>
          }
        />

        {/* Login page content editor */}
        <Route
          path="logincontent"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <LoginPageEditor />
            </RoleGuard>
          }
        />

        {/* Testimonials / Certifications */}
        <Route
          path="testimonials"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminTestimonialsManager />
            </RoleGuard>
          }
        />
        <Route
          path="certifications"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminCertificationsManager />
            </RoleGuard>
          }
        />

        {/* Users */}
        <Route
          path="users"
          element={
            <RoleGuard allow={["admin", "owner"]}>
              <AdminUserManager />
            </RoleGuard>
          }
        />

        {/* UI: Header/Carousel */}
        <Route
          path="ui"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminHeaderCarouselManager />
            </RoleGuard>
          }
        />

        {/* Inventory */}
        <Route
          path="inventory"
          element={
            <RoleGuard allow={["admin", "InventoryManagerAdmin", "SalesAdmin"]}>
              <Inventory />
            </RoleGuard>
          }
        />

        {/* Orders (now supports delivery assignment) */}
        <Route
          path="orders"
          element={
            <RoleGuard allow={["admin", "OrderManagementAdmin", "SalesAdmin"]}>
              <Orders />
            </RoleGuard>
          }
        />

        {/* Accounting / Sales */}
        <Route
          path="accounting"
          element={
            <RoleGuard allow={["admin", "OrderManagementAdmin", "SalesAdmin"]}>
              <Accounting />
            </RoleGuard>
          }
        />
        {/* <Route
          path="sales"
          element={
            <RoleGuard allow={["admin", "OrderManagementAdmin", "SalesAdmin"]}>
              <SalesDesk />
            </RoleGuard>
          }
        /> */}
        <Route path="sales" element={<Sales />} />
        <Route path="coa" element={<ChartOfAccounts />} />
        <Route path="JournalViewer" element={<JournalViewer />} />
        <Route path="gst" element={<GstDashboard />} />
        <Route path="financial-statements" element={<FinancialStatements />} />

        {/* Quick-link targets */}
        <Route
          path="customers"
          element={
            <RoleGuard allow={["owner", "admin", "SalesAdmin"]}>
              <Customers />
            </RoleGuard>
          }
        />

        <Route
          path="purchases"
          element={
            <RoleGuard allow={["owner", "admin", "BooksAccountsAdmin", "InventoryManagerAdmin"]}>
              <PurchasesHome />
            </RoleGuard>
          }
        />

        <Route path="expenses" element={<Navigate to="/admin/purchases/expenses" replace />} />





        {/* ADMIN-ONLY: Categories / Products */}
        <Route
          path="categories"
          element={
            <RoleGuard allow={ADMIN_CATEGORIES}>
              <AdminCategoryManager />
            </RoleGuard>
          }
        />
        <Route
          path="products"
          element={
            <RoleGuard allow={ADMIN_PRODUCTS}>
              <AdminProductManager />
            </RoleGuard>
          }
        />

        {/* Admin About Us editor */}
        <Route
          path="about"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminAboutUsEditor />
            </RoleGuard>
          }
        />

        {/* 🔹 NEW: Delivery — Settings */}
        <Route
          path="delivery-settings"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <AdminDeliverySettings />
            </RoleGuard>
          }
        />







        <Route
          path="pos"
          element={
            <RoleGuard allow={["owner", "admin", "SalesAdmin", "InventoryManagerAdmin"]}>
              <POS />
            </RoleGuard>
          }
        />

        {/* 🔹 NEW: Delivery — Delivery Boys CRUD */}
        <Route
          path="delivery-boys"
          element={
            <RoleGuard allow={["owner", "admin"]}>
              <DeliveryBoyManager />
            </RoleGuard>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
    </Routes>
  );
}
