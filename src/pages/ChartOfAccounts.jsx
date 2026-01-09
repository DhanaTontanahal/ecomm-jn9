// src/pages/ChartOfAccounts.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// ---- tokens ----
const TOK = {
  bg: "#020617",
  panel: "rgba(15,23,42,0.96)",
  border: "rgba(148,163,184,0.35)",
  text: "#e5e7eb",
  sub: "#9ca3af",
  accent: "#4ade80",
  accentSoft: "rgba(74,222,128,0.12)",
  danger: "#f97373",
};

const Page = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 16px;
  color: ${TOK.text};
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Hint = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${TOK.sub};
`;

const SeedBtn = styled.button`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  padding: 8px 14px;
  background: ${TOK.accentSoft};
  color: ${TOK.accent};
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${TOK.panel};
  border-radius: 12px;
  border: 1px solid ${TOK.border};
  padding: 12px;
  max-height: calc(100vh - 200px);
  overflow: auto;
`;

// ---- table ----
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 6px;
  border-bottom: 1px solid ${TOK.border};
  color: ${TOK.sub};
  font-weight: 500;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 6px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.75);
  vertical-align: middle;
`;

const BadgeType = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid ${TOK.border};
  color: ${TOK.sub};
`;

const ActiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
  margin-right: 4px;
  background: ${({ $on }) => ($on ? TOK.accent : TOK.danger)};
`;

const SmallBtn = styled.button`
  border-radius: 999px;
  border: 1px solid ${TOK.border};
  background: transparent;
  color: ${TOK.text};
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  margin-left: 4px;
`;

// ---- form ----
const FormTitle = styled.h2`
  font-size: 15px;
  margin: 0 0 8px;
`;

const Form = styled.form`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 12px;
  color: ${TOK.sub};
`;

const Input = styled.input`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${TOK.border};
  padding: 7px 9px;
  background: rgba(15, 23, 42, 0.7);
  color: ${TOK.text};
  font-size: 13px;
`;

const Select = styled.select`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${TOK.border};
  padding: 7px 9px;
  background: rgba(15, 23, 42, 0.7);
  color: ${TOK.text};
  font-size: 13px;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${TOK.sub};
`;

const PrimaryBtn = styled.button`
  height: 38px;
  border-radius: 10px;
  border: 0;
  background: ${TOK.accent};
  color: #022c22;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
`;

const MutedBtn = styled.button`
  height: 38px;
  border-radius: 10px;
  border: 1px solid ${TOK.border};
  background: transparent;
  color: ${TOK.sub};
  font-size: 13px;
  cursor: pointer;
`;

// ---- DEFAULT 10 ACCOUNTS ----
const DEFAULT_ACCOUNTS = [
  {
    code: "1002",
    name: "Sales - Online",
    type: "INCOME",
    subType: "SALES",
    normalBalance: "CREDIT",
    defaultFor: "SALES_ONLINE",
  },

  {
    code: "1000",
    name: "Cash-in-hand",
    type: "ASSET",
    subType: "CASH",
    normalBalance: "DEBIT",
    defaultFor: "CASH_MAIN",
  },
  {
    code: "1001",
    name: "Bank - Main A/c",
    type: "ASSET",
    subType: "BANK",
    normalBalance: "DEBIT",
    defaultFor: "BANK_MAIN",
  },
  {
    code: "1100",
    name: "Accounts Receivable",
    type: "ASSET",
    subType: "DEBTOR",
    normalBalance: "DEBIT",
    defaultFor: "AR",
  },
  {
    code: "1200",
    name: "Inventory",
    type: "ASSET",
    subType: "INVENTORY",
    normalBalance: "DEBIT",
    defaultFor: "INVENTORY",
  },

  {
    code: "2100",
    name: "GST Output",
    type: "LIABILITY",
    subType: "GST_OUTPUT",
    normalBalance: "CREDIT",
    defaultFor: "GST_OUTPUT",
  },
  {
    code: "4000",
    name: "Sales",
    type: "INCOME",
    subType: "SALES",
    normalBalance: "CREDIT",
    defaultFor: "SALES_GENERAL",
  },
  {
    code: "5000",
    name: "Purchase",
    type: "EXPENSE",
    subType: "PURCHASE",
    normalBalance: "DEBIT",
    defaultFor: "PURCHASE",
  },
  {
    code: "5500",
    name: "Packaging Expense",
    type: "EXPENSE",
    subType: "PACKAGING",
    normalBalance: "DEBIT",
    defaultFor: "PACKAGING",
  },
  {
    code: "5600",
    name: "Salary Expense",
    type: "EXPENSE",
    subType: "SALARY",
    normalBalance: "DEBIT",
    defaultFor: "SALARY",
  },
  { code: "1105", name: "Accounts Receivable - COD", type: "ASSET", subType: "DEBTOR", normalBalance: "DEBIT", defaultFor: "AR_COD" },
  ,
  { code: "1010", name: "Bank - Main A/c", type: "ASSET", subType: "BANK", normalBalance: "DEBIT", defaultFor: "BANK_MAIN" },

  {
    code: "4001",
    name: "Sales - POS",
    type: "INCOME",
    subType: "SALES",
    normalBalance: "CREDIT",
    defaultFor: "SALES_POS",
  },
  {
    code: "2105",
    name: "GST Input",
    type: "ASSET",
    subType: "GST_INPUT",
    normalBalance: "DEBIT",
    defaultFor: "GST_INPUT",
  },

  {
    code: "2000",
    name: "Accounts Payable",
    type: "LIABILITY",
    subType: "CREDITOR",
    normalBalance: "CREDIT",
    defaultFor: "AP_VENDOR", 
  }



];

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // account id or null

  // form state
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    subType: "",
    normalBalance: "DEBIT",
    defaultFor: "",
    isActive: true,
  });

  // ---- load accounts ----
  const loadAccounts = async () => {
    setLoading(true);
    const qRef = query(
      collection(db, "chartOfAccounts"),
      orderBy("type", "asc"),
      orderBy("code", "asc")
    );
    const snap = await getDocs(qRef);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAccounts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // ---- seed defaults (idempotent) ----
  const seedDefaults = async () => {
    if (
      !window.confirm(
        "Add default accounts (Cash, Bank, Sales, Purchase, GST, etc.)?\nExisting accounts will be kept; only missing ones will be created."
      )
    )
      return;

    const existingCodes = new Set(accounts.map((a) => String(a.code)));
    const toCreate = DEFAULT_ACCOUNTS.filter(
      (acc) => !existingCodes.has(String(acc.code))
    );

    if (!toCreate.length) {
      alert("All default accounts are already present.");
      return;
    }

    const col = collection(db, "chartOfAccounts");
    for (const acc of toCreate) {
      await addDoc(col, {
        ...acc,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await loadAccounts();
    alert(`Added ${toCreate.length} default account(s).`);
  };

  // ---- handle form ----
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      type: "ASSET",
      subType: "",
      normalBalance: "DEBIT",
      defaultFor: "",
      isActive: true,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      alert("Code & Name are required");
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      subType: form.subType.trim() || null,
      normalBalance: form.normalBalance,
      defaultFor: form.defaultFor.trim() || null,
      isActive: !!form.isActive,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editing) {
        await updateDoc(doc(db, "chartOfAccounts", editing), payload);
      } else {
        await addDoc(collection(db, "chartOfAccounts"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      await loadAccounts();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Could not save account");
    }
  };

  const startEdit = (acc) => {
    setEditing(acc.id);
    setForm({
      code: acc.code || "",
      name: acc.name || "",
      type: acc.type || "ASSET",
      subType: acc.subType || "",
      normalBalance: acc.normalBalance || "DEBIT",
      defaultFor: acc.defaultFor || "",
      isActive: acc.isActive !== false,
    });
  };

  const toggleActive = async (acc) => {
    try {
      await updateDoc(doc(db, "chartOfAccounts", acc.id), {
        isActive: !acc.isActive,
        updatedAt: serverTimestamp(),
      });
      await loadAccounts();
    } catch (err) {
      console.error(err);
      alert("Could not update status");
    }
  };

  // helper to show how many defaults exist
  const defaultCodes = new Set(DEFAULT_ACCOUNTS.map((a) => a.code));
  const defaultsPresent = accounts.filter((a) =>
    defaultCodes.has(String(a.code))
  ).length;

  return (
    <Page>
      <TitleRow>
        <div>
          <H1>Chart of Accounts</H1>
          <Hint>
            Define all accounting heads (assets, liabilities, income, expenses)
            for your business.
          </Hint>
        </div>

        <SeedBtn onClick={seedDefaults}>
          Add default accounts
          {defaultsPresent > 0
            ? ` (${defaultsPresent}/${DEFAULT_ACCOUNTS.length} present)`
            : ""}
        </SeedBtn>
      </TitleRow>

      <Layout>
        {/* LEFT: list */}
        <Panel>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: TOK.sub }}>
              Total accounts: {accounts.length}
            </span>
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: TOK.sub }}>
              Loading accounts…
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ fontSize: 13, color: TOK.sub }}>
              No accounts yet. Click “Add default accounts” or create manually.
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Normal</Th>
                  <Th>Default For</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <Td>{acc.code}</Td>
                    <Td>{acc.name}</Td>
                    <Td>
                      <BadgeType>{acc.type}</BadgeType>
                      {acc.subType && (
                        <div
                          style={{
                            fontSize: 11,
                            color: TOK.sub,
                            marginTop: 2,
                          }}
                        >
                          {acc.subType}
                        </div>
                      )}
                    </Td>
                    <Td>{acc.normalBalance}</Td>
                    <Td style={{ fontSize: 11, color: TOK.sub }}>
                      {acc.defaultFor || "—"}
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12 }}>
                        <ActiveDot $on={acc.isActive !== false} />
                        {acc.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </Td>
                    <Td>
                      <SmallBtn onClick={() => startEdit(acc)}>Edit</SmallBtn>
                      <SmallBtn onClick={() => toggleActive(acc)}>
                        {acc.isActive !== false ? "Deactivate" : "Activate"}
                      </SmallBtn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        {/* RIGHT: form */}
        <Panel>
          <FormTitle>
            {editing ? "Edit Account" : "Create New Account"}
          </FormTitle>
          <Form onSubmit={onSubmit}>
            <div>
              <Label>Code *</Label>
              <Input
                name="code"
                value={form.code}
                onChange={onChange}
                placeholder="e.g. 4000"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Sales - Retail"
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select name="type" value={form.type} onChange={onChange}>
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="INCOME">INCOME</option>
                <option value="EXPENSE">EXPENSE</option>
              </Select>
            </div>
            <div>
              <Label>Sub Type (optional)</Label>
              <Input
                name="subType"
                value={form.subType}
                onChange={onChange}
                placeholder="e.g. CASH, BANK, SALES, PURCHASE, GST_OUTPUT..."
              />
            </div>
            <div>
              <Label>Normal Balance *</Label>
              <Select
                name="normalBalance"
                value={form.normalBalance}
                onChange={onChange}
              >
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </Select>
            </div>
            <div>
              <Label>Default For (mapping tag, optional)</Label>
              <Input
                name="defaultFor"
                value={form.defaultFor}
                onChange={onChange}
                placeholder="e.g. SALES_GENERAL, GST_OUTPUT"
              />
            </div>
            <CheckboxRow>
              <input
                id="isActive"
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={onChange}
              />
              <label htmlFor="isActive">Active</label>
            </CheckboxRow>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              <PrimaryBtn type="submit">
                {editing ? "Update Account" : "Create Account"}
              </PrimaryBtn>
              <MutedBtn type="button" onClick={resetForm}>
                Clear
              </MutedBtn>
            </div>
          </Form>
        </Panel>
      </Layout>
    </Page>
  );
}
