// src/pages/settings/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { toast } from "react-toastify";
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc,
  query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

/* ====== UI Tokens (kept close to your admin look) ====== */
const C = {
  bg: "#0b1220",
  panel: "rgba(255,255,255,.06)",
  panel2: "rgba(255,255,255,.10)",
  border: "rgba(255,255,255,.14)",
  text: "#e7efff",
  sub: "#b7c6e6",
  primary: "#4ea1ff",
  ok: "#10b981",
  danger: "#ef4444",
  ring: "#78c7ff",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Page = styled.div`
  min-height: 100dvh; background:${C.bg}; color:${C.text};
  padding: 20px; animation:${fade} .25s both;
`;
const Shell = styled.div`
  max-width: 1100px; margin: 0 auto; display:grid; gap:14px;
`;
const Tabs = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;
const Tab = styled.button`
  appearance:none; border:1px solid ${C.border}; color:${C.text};
  background:${p => p.$active ? C.panel2 : C.panel}; padding:10px 14px; border-radius:10px;
  cursor:pointer; font-weight:${p => p.$active ? 700 : 500};
  &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}}
`;
const Card = styled.div`
  background:${C.panel}; border:1px solid ${C.border}; border-radius:14px; padding:14px;
`;
const Grid = styled.div`
  display:grid; gap:12px;
  grid-template-columns: 1fr;
  @media(min-width:980px){ grid-template-columns: 1fr 1fr; }
`;
const Field = styled.div`display:grid; gap:6px;`;
const L = styled.label`font-size:12px; color:${C.sub}`;
const I = styled.input`
  background:${C.panel2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}}
`;
const S = styled.select`
  background:${C.panel2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px;
  color-scheme: dark; &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}}
  option{background:#121a2b}
`;
const TA = styled.textarea`
  background:${C.panel2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; min-height:96px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}}
`;
const Row = styled.div`display:flex; gap:8px; flex-wrap:wrap; align-items:center;`;
const Btn = styled.button`
  background:${p => p.$danger ? C.danger : (p.$ok ? C.ok : C.primary)}; color:#fff; border:none; border-radius:10px; padding:10px 12px; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const Small = styled.div`font-size:12px; color:${C.sub}`;

/* =========================================================
   Tab 1: Setup Organization  (doc: settings/orgProfile)
   ========================================================= */
function SetupOrganizationTab() {
  const ref = doc(db, "settings", "orgProfile");
  const [v, setV] = useState({
    orgName: "", industry: "", businessLocation: "", address1: "", address2: "",
    city: "", state: "", zip: "", phone: "", website: "",
    fiscalYear: "April - March", reportBasis: "accrual",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    dateFormat: "dd/MM/yyyy",
    companyId: "", taxId: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(ref);
      if (s.exists()) setV(prev => ({ ...prev, ...s.data() }));
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await setDoc(ref, { ...v, updatedAt: serverTimestamp() }, { merge: true });
      toast.success("Organization profile saved.");
    } catch (e) {
      console.error(e); toast.error("Failed to save.");
    } finally { setSaving(false); }
  }

  return (
    <Card>
      <Grid>
        <Field><L>Organization Name*</L><I value={v.orgName} onChange={e => setV({ ...v, orgName: e.target.value })} /></Field>
        <Field><L>Industry</L><I value={v.industry} onChange={e => setV({ ...v, industry: e.target.value })} /></Field>

        <Field><L>Business Location</L><I value={v.businessLocation} onChange={e => setV({ ...v, businessLocation: e.target.value })} /></Field>
        <Field><L>Website</L><I value={v.website} onChange={e => setV({ ...v, website: e.target.value })} /></Field>

        <Field><L>Address line 1</L><I value={v.address1} onChange={e => setV({ ...v, address1: e.target.value })} /></Field>
        <Field><L>Address line 2</L><I value={v.address2} onChange={e => setV({ ...v, address2: e.target.value })} /></Field>

        <Field><L>City</L><I value={v.city} onChange={e => setV({ ...v, city: e.target.value })} /></Field>
        <Field><L>State / Province</L><I value={v.state} onChange={e => setV({ ...v, state: e.target.value })} /></Field>

        <Field><L>Postal Code</L><I value={v.zip} onChange={e => setV({ ...v, zip: e.target.value })} /></Field>
        <Field><L>Phone</L><I value={v.phone} onChange={e => setV({ ...v, phone: e.target.value })} /></Field>

        <Field>
          <L>Fiscal Year</L>
          <S value={v.fiscalYear} onChange={e => setV({ ...v, fiscalYear: e.target.value })}>
            {["January - December", "April - March", "July - June"].map(x => <option key={x} value={x}>{x}</option>)}
          </S>
        </Field>
        <Field>
          <L>Report Basis</L>
          <S value={v.reportBasis} onChange={e => setV({ ...v, reportBasis: e.target.value })}>
            <option value="accrual">Accrual (recognize on invoice date)</option>
            <option value="cash">Cash (recognize on payment)</option>
          </S>
        </Field>

        <Field><L>Time Zone</L><I value={v.timeZone} onChange={e => setV({ ...v, timeZone: e.target.value })} /></Field>
        <Field><L>Date Format</L><I value={v.dateFormat} onChange={e => setV({ ...v, dateFormat: e.target.value })} /></Field>

        <Field><L>Company ID</L><I value={v.companyId} onChange={e => setV({ ...v, companyId: e.target.value })} /></Field>
        <Field><L>Tax ID</L><I value={v.taxId} onChange={e => setV({ ...v, taxId: e.target.value })} /></Field>
      </Grid>

      <Row style={{ marginTop: 12 }}>
        <Btn onClick={save} disabled={saving}>Save</Btn>
      </Row>
    </Card>
  );
}

/* =========================================================
   Tab 2: Opening Balances (doc: settings/openingBalances)
   ========================================================= */
const OB_SECTIONS = [
  { id: "ar", label: "Accounts Receivable (Customers)" },
  { id: "ap", label: "Accounts Payable (Vendors)" },
  { id: "asset", label: "Assets", defaults: ["Petty Cash", "Undeposited Funds", "Furniture & Equipment", "Inventory Asset"] },
  { id: "expense", label: "Expenses" },
  { id: "bank", label: "Bank" },
  { id: "liability", label: "Liabilities" },
  { id: "equity", label: "Equity" },
];

function OpeningBalancesTab() {
  const ref = doc(db, "settings", "openingBalances");
  const [v, setV] = useState({
    migrationDate: "", // yyyy-mm-dd
    ar: [], ap: [], asset: [], expense: [], bank: [], liability: [], equity: []
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(ref);
      if (s.exists()) setV(prev => ({ ...prev, ...s.data() }));
      if (!s.exists() || (s.exists() && (!s.data().asset || s.data().asset.length === 0))) {
        setV(x => ({ ...x, asset: (OB_SECTIONS.find(z => z.id === "asset").defaults || []).map(name => ({ name, debit: 0, credit: 0 })) }));
      }
    })();
  }, []);

  function updateRow(section, idx, patch) {
    setV(prev => {
      const arr = [...(prev[section] || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...prev, [section]: arr };
    });
  }
  function addRow(section) {
    setV(prev => ({ ...prev, [section]: [...(prev[section] || []), { name: "", debit: 0, credit: 0 }] }));
  }
  function removeRow(section, idx) {
    setV(prev => {
      const arr = [...(prev[section] || [])];
      arr.splice(idx, 1);
      return { ...prev, [section]: arr };
    });
  }
  async function save() {
    setBusy(true);
    try {
      await setDoc(ref, { ...v, updatedAt: serverTimestamp() }, { merge: true });
      toast.success("Opening balances saved.");
    } catch (e) { console.error(e); toast.error("Failed to save."); }
    finally { setBusy(false); }
  }

  return (
    <Card>
      <Grid>
        <Field><L>Migration Date*</L><I type="date" value={v.migrationDate || ""} onChange={e => setV({ ...v, migrationDate: e.target.value })} /></Field>
      </Grid>

      {OB_SECTIONS.map(sec => (
        <div key={sec.id} style={{ marginTop: 16, borderTop: `1px dashed ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>{sec.label}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub }}>Account</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub, width: 140 }}>Debit</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub, width: 140 }}>Credit</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {(v[sec.id] || []).map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 8px" }}><I value={row.name} onChange={e => updateRow(sec.id, i, { name: e.target.value })} /></td>
                    <td style={{ padding: "6px 8px" }}><I type="number" value={row.debit} onChange={e => updateRow(sec.id, i, { debit: Number(e.target.value || 0) })} /></td>
                    <td style={{ padding: "6px 8px" }}><I type="number" value={row.credit} onChange={e => updateRow(sec.id, i, { credit: Number(e.target.value || 0) })} /></td>
                    <td style={{ padding: "6px 8px" }}><Btn $danger onClick={() => removeRow(sec.id, i)}>Del</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Row style={{ marginTop: 8 }}>
            <Btn onClick={() => addRow(sec.id)}>+ Add account</Btn>
          </Row>
        </div>
      ))}

      <Row style={{ marginTop: 14 }}>
        <Btn onClick={save} disabled={busy}>Save Opening Balances</Btn>
      </Row>
    </Card>
  );
}

/* =========================================================
   Tab 3: Taxes (collection: settings/taxes/taxRates)
   ========================================================= */
function TaxesTab() {
  const col = collection(db, "settings", "taxes", "taxRates");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", type: "GST", rate: 0 });

  async function load() {
    const s = await getDocs(query(col, orderBy("name", "asc")));
    setRows(s.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    try {
      if (form.id) {
        await updateDoc(doc(db, "settings", "taxes", "taxRates", form.id), {
          name: form.name.trim(), type: form.type, rate: Number(form.rate || 0), updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(col, {
          name: form.name.trim(), type: form.type, rate: Number(form.rate || 0), createdAt: serverTimestamp()
        });
      }
      setForm({ id: null, name: "", type: "GST", rate: 0 });
      await load();
      toast.success("Saved tax rate.");
    } catch (e) { console.error(e); toast.error("Failed to save."); }
  }
  async function edit(r) { setForm(r); }
  async function del(id) {
    if (!window.confirm("Delete this tax rate?")) return;
    await deleteDoc(doc(db, "settings", "taxes", "taxRates", id));
    await load();
  }

  return (
    <Card>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Tax Rates</div>
      <Row style={{ gap: 8, marginBottom: 10 }}>
        <I placeholder="Name (e.g. GST18)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ minWidth: 220 }} />
        <S value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="GST">GST</option>
          <option value="IGST">IGST</option>
          <option value="CGST/SGST">CGST/SGST</option>
          <option value="Other">Other</option>
        </S>
        <I type="number" placeholder="Rate %" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} style={{ width: 140 }} />
        <Btn onClick={save}>{form.id ? "Update" : "Add"}</Btn>
        {form.id && <Btn $danger onClick={() => setForm({ id: null, name: "", type: "GST", rate: 0 })}>Cancel</Btn>}
      </Row>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub }}>Name</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub }}>Type</th>
              <th style={{ textAlign: "left", padding: "6px 8px", color: C.sub }}>Rate %</th>
              <th style={{ width: 160 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: "6px 8px" }}>{r.name}</td>
                <td style={{ padding: "6px 8px" }}>{r.type}</td>
                <td style={{ padding: "6px 8px" }}>{r.rate}</td>
                <td style={{ padding: "6px 8px" }}>
                  <Row>
                    <Btn onClick={() => edit(r)}>Edit</Btn>
                    <Btn $danger onClick={() => del(r.id)}>Delete</Btn>
                  </Row>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={4} style={{ padding: "8px", color: C.sub }}>No tax rates yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* =========================================================
   Tab 4: Accounting Settings (doc: settings/app)
   ========================================================= */
function SeqRow({ code, label, v, onChange }) {
  return (
    <Row style={{ gap: 8 }}>
      <Field style={{ minWidth: 180 }}>
        <L>{label} Prefix</L>
        <I value={v[code]?.prefix ?? ""} onChange={e => onChange(code, { ...v[code], prefix: e.target.value })} />
      </Field>
      <Field style={{ width: 160 }}>
        <L>Next Number</L>
        <I type="number" value={v[code]?.next ?? 1} onChange={e => onChange(code, { ...v[code], next: Number(e.target.value || 1) })} />
      </Field>
    </Row>
  );
}

function ListEditor({ value = [], onChange, title }) {
  const add = () => onChange([...(value || []), { name: "", days: 0 }]);
  const upd = (i, patch) => {
    const arr = [...value]; arr[i] = { ...arr[i], ...patch }; onChange(arr);
  };
  const del = (i) => { const arr = [...value]; arr.splice(i, 1); onChange(arr); };

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {(value || []).map((r, i) => (
        <Row key={i}>
          <I placeholder="Name" value={r.name} onChange={e => upd(i, { name: e.target.value })} style={{ minWidth: 200 }} />
          <I type="number" placeholder="Due in days" value={r.days} onChange={e => upd(i, { days: Number(e.target.value || 0) })} style={{ width: 140 }} />
          <Btn $danger onClick={() => del(i)}>Remove</Btn>
        </Row>
      ))}
      <Row style={{ marginTop: 6 }}><Btn onClick={add}>+ Add</Btn></Row>
    </div>
  );
}

function AccountingSettingsTab() {
  const ref = doc(db, "settings", "app");
  const [v, setV] = useState({
    currency: { base: "INR", enabled: false },
    seq: { invoice:{prefix:"INV-",next:1}, bill:{prefix:"BILL-",next:1}, po:{prefix:"PO-",next:1}, so:{prefix:"SO-",next:1}, estimate:{prefix:"EST-",next:1}, cn:{prefix:"CN-",next:1}, payment:{prefix:"PAY-",next:1} },
    accounts: { sales:"Sales", expenseDefault:"Expense", cogs:"COGS", taxInput:"GST Input", taxOutput:"GST Output", rounding:"Rounding" },
    terms: { customer:[], vendor:[] },
    accounting: { autoApplyCredits: { customer:true, vendor:true }, reportBasis:"accrual" },
    pricing: { roundMode:"DOCUMENT", decimals:2 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await getDoc(ref);
      if (s.exists()) setV(prev => ({ ...prev, ...s.data() }));
      setLoading(false);
    })();
  }, []);

  // helper to patch a dot-path
  async function savePatch(patch) {
    try {
      await setDoc(ref, { updatedAt: serverTimestamp(), ...patch }, { merge: true });
      toast.success("Saved.");
    } catch (e) { console.error(e); toast.error("Failed to save."); }
  }

  const setSeq = (code, obj) => setV(prev => ({ ...prev, seq: { ...prev.seq, [code]: obj } }));
  const saveSeq = () => savePatch({ seq: v.seq });

  const setAccounts = (key, val) => setV(prev => ({ ...prev, accounts: { ...prev.accounts, [key]: val } }));
  const saveAccounts = () => savePatch({ accounts: v.accounts });

  const setTerms = (key, arr) => setV(prev => ({ ...prev, terms: { ...prev.terms, [key]: arr } }));
  const saveTerms = () => savePatch({ terms: v.terms });

  if (loading) return <Card><Small>Loading…</Small></Card>;

  return (
    <Card>
      <div style={{ display:"grid", gap:18 }}>
        {/* Currency */}
        <div>
          <div style={{ fontWeight:800, marginBottom:8 }}>Currency</div>
          <Row>
            <Field style={{ width: 160 }}>
              <L>Base</L>
              <S value={v.currency?.base ?? "INR"} onChange={e => setV(prev => ({ ...prev, currency: { ...prev.currency, base: e.target.value } }))}>
                {["INR","USD","EUR","GBP","AED","AUD","CAD","SGD"].map(c => <option key={c} value={c}>{c}</option>)}
              </S>
            </Field>
            <Field>
              <L>Enable Multi-currency</L>
              <Row>
                <input type="checkbox" checked={!!v.currency?.enabled} onChange={e => setV(prev => ({ ...prev, currency: { ...prev.currency, enabled: e.target.checked } }))} />
                <Small>Allow transactions in other currencies</Small>
              </Row>
            </Field>
            <Btn onClick={() => savePatch({ currency: v.currency })}>Save Currency</Btn>
          </Row>
        </div>

        {/* Numbering */}
        <div>
          <div style={{ fontWeight:800, marginBottom:8 }}>Numbering Sequences</div>
          <Row style={{ flexDirection:"column", alignItems:"stretch", gap:10 }}>
            <SeqRow code="invoice" label="Invoice" v={v.seq} onChange={setSeq} />
            <SeqRow code="bill" label="Bill" v={v.seq} onChange={setSeq} />
            <SeqRow code="po" label="Purchase Order" v={v.seq} onChange={setSeq} />
            <SeqRow code="so" label="Sales Order" v={v.seq} onChange={setSeq} />
            <SeqRow code="estimate" label="Estimate" v={v.seq} onChange={setSeq} />
            <SeqRow code="cn" label="Credit Note" v={v.seq} onChange={setSeq} />
            <SeqRow code="payment" label="Payment" v={v.seq} onChange={setSeq} />
          </Row>
          <Row style={{ marginTop:8 }}><Btn onClick={saveSeq}>Save Numbering</Btn></Row>
        </div>

        {/* Defaults */}
        <div>
          <div style={{ fontWeight:800, marginBottom:8 }}>Default Accounts</div>
          <Grid>
            <Field><L>Sales Account</L><I value={v.accounts?.sales ?? ""} onChange={e => setAccounts("sales", e.target.value)} /></Field>
            <Field><L>Expense Default</L><I value={v.accounts?.expenseDefault ?? ""} onChange={e => setAccounts("expenseDefault", e.target.value)} /></Field>
            <Field><L>COGS</L><I value={v.accounts?.cogs ?? ""} onChange={e => setAccounts("cogs", e.target.value)} /></Field>
            <Field><L>Tax Output (GST Payable)</L><I value={v.accounts?.taxOutput ?? ""} onChange={e => setAccounts("taxOutput", e.target.value)} /></Field>
            <Field><L>Tax Input (GST Receivable)</L><I value={v.accounts?.taxInput ?? ""} onChange={e => setAccounts("taxInput", e.target.value)} /></Field>
            <Field><L>Rounding Account</L><I value={v.accounts?.rounding ?? ""} onChange={e => setAccounts("rounding", e.target.value)} /></Field>
          </Grid>
          <Row style={{ marginTop:8 }}><Btn onClick={saveAccounts}>Save Defaults</Btn></Row>
        </div>

        {/* Terms */}
        <div>
          <Grid>
            <Card style={{ background:C.panel2, borderColor:C.border }}>
              <ListEditor title="Customer Payment Terms" value={v.terms?.customer || []} onChange={arr => setTerms("customer", arr)} />
            </Card>
            <Card style={{ background:C.panel2, borderColor:C.border }}>
              <ListEditor title="Vendor Payment Terms" value={v.terms?.vendor || []} onChange={arr => setTerms("vendor", arr)} />
            </Card>
          </Grid>
          <Row style={{ marginTop:8 }}><Btn onClick={saveTerms}>Save Terms</Btn></Row>
        </div>

        {/* Credits & rounding */}
        <div>
          <div style={{ fontWeight:800, marginBottom:8 }}>Credits & Rounding</div>
          <Grid>
            <Field>
              <L>Auto-apply Customer Credits</L>
              <input type="checkbox"
                checked={!!v.accounting?.autoApplyCredits?.customer}
                onChange={e => setV(prev => ({ ...prev, accounting: { ...prev.accounting, autoApplyCredits: { ...(prev.accounting?.autoApplyCredits||{}), customer: e.target.checked } } }))} />
            </Field>
            <Field>
              <L>Auto-apply Vendor Credits</L>
              <input type="checkbox"
                checked={!!v.accounting?.autoApplyCredits?.vendor}
                onChange={e => setV(prev => ({ ...prev, accounting: { ...prev.accounting, autoApplyCredits: { ...(prev.accounting?.autoApplyCredits||{}), vendor: e.target.checked } } }))} />
            </Field>
            <Field>
              <L>Rounding Mode</L>
              <S value={v.pricing?.roundMode ?? "DOCUMENT"}
                 onChange={e => setV(prev => ({ ...prev, pricing: { ...prev.pricing, roundMode: e.target.value } }))}>
                <option value="LINE">Line level</option>
                <option value="DOCUMENT">Document level</option>
              </S>
            </Field>
            <Field>
              <L>Price/Tax Decimals</L>
              <I type="number" value={v.pricing?.decimals ?? 2}
                 onChange={e => setV(prev => ({ ...prev, pricing: { ...prev.pricing, decimals: Number(e.target.value || 0) } }))}/>
            </Field>
          </Grid>
          <Row style={{ marginTop:8 }}>
            <Btn onClick={() => savePatch({ accounting: v.accounting, pricing: v.pricing })}>Save Credits & Rounding</Btn>
          </Row>
          <Small style={{ marginTop:6 }}>
            Report basis is set under <b>Setup Organization</b> and read by reports.
          </Small>
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   Page Shell (tabs)
   ========================================================= */
export default function Settings() {
  const [tab, setTab] = useState("org");
  return (
    <Page>
      <Shell>
        <h2 style={{ margin: "0 0 6px" }}>Settings</h2>
        <Tabs>
          <Tab $active={tab === "org"} onClick={() => setTab("org")}>Setup Organization</Tab>
          <Tab $active={tab === "opening"} onClick={() => setTab("opening")}>Opening Balances</Tab>
          <Tab $active={tab === "tax"} onClick={() => setTab("tax")}>Taxes</Tab>
          <Tab $active={tab === "acct"} onClick={() => setTab("acct")}>Accounting</Tab>
        </Tabs>

        {tab === "org" && <SetupOrganizationTab />}
        {tab === "opening" && <OpeningBalancesTab />}
        {tab === "tax" && <TaxesTab />}
        {tab === "acct" && <AccountingSettingsTab />}
      </Shell>
    </Page>
  );
}
