import React from "react";
import { Link } from "react-router-dom";

const box = {
    padding: 16,
    border: "1px solid rgba(0,0,0,.1)",
    borderRadius: 10,
    background: "rgba(255,255,255,.04)",
};

export default function PurchasesHome() {
    return (
        <div style={{ padding: 16 }}>
            <h2>Purchases</h2>
            <p>Jump to a sub-module:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                <Link to="/admin/purchases/vendors" style={box}>Vendors</Link>
                <Link to="/admin/purchases/purchase-orders" style={box}>Purchase Orders</Link>
                <Link to="/admin/purchases/bills" style={box}>Bills</Link>
                <Link to="/admin/purchases/expenses" style={box}>Expenses</Link>
                <Link to="/admin/purchases/recurring-expenses" style={box}>Recurring Expenses</Link>
                <Link to="/admin/purchases/payments-made" style={box}>Vendor Payments</Link>
                <Link to="/admin/purchases/vendor-credits" style={box}>Vendor Credits</Link>
            </div>
        </div>
    );
}
