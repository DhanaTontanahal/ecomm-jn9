// src/components/SideMenuGroups/PurchasesGroup.jsx
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import {
    FiChevronDown, FiChevronRight,
    FiUsers, FiTrendingDown, FiRepeat, FiFilePlus,
    FiFileText, FiCreditCard, FiRefreshCw, FiRotateCcw
} from "react-icons/fi";
import { useState } from "react";

const Group = styled.div`margin: 10px 0 6px;`;
const Head = styled.button`
  width:100%; background:none; border:0; color:inherit; cursor:pointer;
  display:flex; align-items:center; justify-content:space-between; padding:8px 6px; border-radius:8px;
  &:hover{ background: rgba(255,255,255,.06); }
`;
const Label = styled.span`font-weight:700; letter-spacing:.3px;`;
const List = styled.div`margin-top:6px;`;
const Item = styled(NavLink)`
  display:flex; gap:10px; align-items:center; padding:8px 10px; margin: 2px 0;
  border-radius:8px; color:inherit; text-decoration:none; opacity:.95;
  &.active{ background: rgba(255,255,255,.06); opacity:1; }
  svg{ font-size:18px; }
`;

export default function PurchasesGroup({ canSee = true }) {
    const [open, setOpen] = useState(true);
    if (!canSee) return null;
    return (
        <Group>
            <Head onClick={() => setOpen(v => !v)}>
                <Label>Purchases</Label>
                {open ? <FiChevronDown /> : <FiChevronRight />}
            </Head>
            {open && (
                <List>
                    <Item to="/admin/purchases/vendors"><FiUsers /> Vendors</Item>
                    <Item to="/admin/purchases/expenses"><FiTrendingDown /> Expenses</Item>
                    <Item to="/admin/purchases/recurring-expenses"><FiRepeat /> Recurring Expenses</Item>
                    <Item to="/admin/purchases/purchase-orders"><FiFilePlus /> Purchase Orders</Item>
                    <Item to="/admin/purchases/bills"><FiFileText /> Bills</Item>
                    <Item to="/admin/purchases/payments-made"><FiCreditCard /> Payments Made</Item>
                    <Item to="/admin/purchases/recurring-bills"><FiRefreshCw /> Recurring Bills</Item>
                    <Item to="/admin/purchases/vendor-credits"><FiRotateCcw /> Vendor Credits</Item>
                </List>
            )}
        </Group>
    );
}
