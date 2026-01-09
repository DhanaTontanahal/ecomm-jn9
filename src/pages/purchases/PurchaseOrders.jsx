// src/pages/purchases/PurchaseOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { PageShell, Head, Input, Select, Btn, Card, Table, C, quickPdfPrint, computeTotals } from "./_shared";
import { FiPlus, FiSearch, FiDownload, FiCheckCircle } from "react-icons/fi";

function DrawerPO({ initial, vendors, onClose }) {
  const [po, setPo] = useState(initial ?? {
    vendorId: "", refNo:"", date: new Date().toISOString().slice(0,10),
    taxPct: 0, notes:"", status:"DRAFT",
    lines: [{ name:"", qty:1, rate:0 }]
  });
  const totals = useMemo(()=> computeTotals(po.lines, po.taxPct), [po]);

  function setLine(i, patch) {
    const lines = [...po.lines]; lines[i] = { ...lines[i], ...patch }; setPo({ ...po, lines });
  }

  async function save() {
    const payload = { ...po, totals, updatedAt: serverTimestamp(), ...(initial?{}:{createdAt:serverTimestamp()}) };
    if (initial?.id) await updateDoc(doc(db,"purchaseOrders",initial.id), payload);
    else await addDoc(collection(db,"purchaseOrders"), payload);
    onClose(true);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"grid",placeItems:"center",zIndex:90}}>
      <div style={{width:"min(980px,96vw)",maxHeight:"92vh",overflow:"auto",background:"#0d1526",border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0}}>{initial?"Edit":"New"} Purchase Order</h3>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={save}>Save</Btn>
            <Btn as="button" style={{background:"transparent",border:`1px solid ${C.border}`,color:C.text}} onClick={()=>onClose(false)}>Close</Btn>
          </div>
        </div>

        <div style={{display:"grid",gap:10}}>
          <Select value={po.vendorId} onChange={e=>setPo({...po, vendorId:e.target.value})}>
            <option value="">Select vendor…</option>
            {vendors.map(v=> <option key={v.id} value={v.id}>{v.displayName}</option>)}
          </Select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Input placeholder="PO Ref No" value={po.refNo} onChange={e=>setPo({...po,refNo:e.target.value})}/>
            <Input type="date" value={po.date} onChange={e=>setPo({...po,date:e.target.value})}/>
          </div>

          <Table>
            <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Line Total</th></tr></thead>
            <tbody>
              {po.lines.map((l,i)=>(
                <tr key={i}>
                  <td><Input value={l.name} onChange={e=>setLine(i,{name:e.target.value})}/></td>
                  <td><Input type="number" value={l.qty} onChange={e=>setLine(i,{qty:+e.target.value})}/></td>
                  <td><Input type="number" value={l.rate} onChange={e=>setLine(i,{rate:+e.target.value})}/></td>
                  <td>{(Number(l.qty||0)*Number(l.rate||0)).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <Btn as="button" onClick={()=>setPo({...po, lines:[...po.lines,{name:"",qty:1,rate:0}]})}><FiPlus/> Add line</Btn>
                </td>
              </tr>
            </tbody>
          </Table>

          <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:10,alignItems:"end"}}>
            <div>
              <Input placeholder="Notes (optional)" value={po.notes} onChange={e=>setPo({...po,notes:e.target.value})}/>
            </div>
            <div>
              <div style={{display:"grid",gap:6}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>Subtotal</span><b>{totals.subtotal.toFixed(2)}</b></div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span>Tax %</span>
                  <Input type="number" value={po.taxPct} onChange={e=>setPo({...po,taxPct:+e.target.value})}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>Tax</span><b>{totals.tax.toFixed(2)}</b></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>Total</span><b>{totals.total.toFixed(2)}</b></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const [rows,setRows] = useState([]);
  const [vendors,setVendors] = useState([]);
  const [qstr,setQstr] = useState(""); const [open,setOpen]=useState(null);

  useEffect(()=>{
    return onSnapshot(query(collection(db,"purchaseOrders"),orderBy("createdAt","desc")), s=> setRows(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);
  useEffect(()=>{
    return onSnapshot(query(collection(db,"vendors")), s=> setVendors(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const filtered = useMemo(()=>{
    const t=qstr.trim().toLowerCase();
    return rows.filter(r=> [r.refNo, r.notes, vendors.find(v=>v.id===r.vendorId)?.displayName].some(x=>String(x||"").toLowerCase().includes(t)));
  },[rows,qstr,vendors]);

  async function convertToBill(po) {
    // create a bill document (open amount defaults to total)
    const totals = po.totals ?? computeTotals(po.lines, po.taxPct);
    await addDoc(collection(db,"bills"), {
      fromPO: po.id, vendorId: po.vendorId, date: po.date, billNo: "", status:"DRAFT",
      lines: po.lines, taxPct: po.taxPct, totals, notes: po.notes||"",
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), openAmount: totals.total
    });
    await updateDoc(doc(db,"purchaseOrders",po.id), { status:"CONVERTED", updatedAt: serverTimestamp() });
    alert("Converted to Bill (draft).");
  }

  return (
    <PageShell>
      <Head>
        <div style={{position:"relative",flex:1}}>
          <Input placeholder="Search PO (vendor / ref / notes)" value={qstr} onChange={e=>setQstr(e.target.value)} style={{paddingLeft:36}}/>
          <FiSearch style={{position:"absolute",left:10,top:12,color:C.sub}}/>
        </div>
        <Btn onClick={()=>setOpen({})}><FiPlus/> New Purchase Order</Btn>
      </Head>

      <Card>
        <Table>
          <thead><tr><th>PO Ref</th><th>Vendor</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(po=>{
              const v = vendors.find(v=>v.id===po.vendorId);
              const totals = po.totals ?? computeTotals(po.lines, po.taxPct);
              return (
                <tr key={po.id}>
                  <td><b>{po.refNo||po.id.slice(0,6)}</b></td>
                  <td>{v?.displayName||"-"}</td>
                  <td>{po.date}</td>
                  <td>{totals.total.toFixed(2)}</td>
                  <td>{po.status||"DRAFT"}</td>
                  <td style={{display:"flex",gap:8}}>
                    <Btn as="button" style={{background:"transparent",border:`1px solid ${C.border}`,color:C.text}} onClick={()=>quickPdfPrint(`Purchase Order ${po.refNo||po.id}`,po)}><FiDownload/> PDF</Btn>
                    {po.status!=="CONVERTED" && (
                      <Btn as="button" onClick={()=>convertToBill(po)}><FiCheckCircle/> Convert to Bill</Btn>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={6} style={{color:C.sub,padding:16}}>No purchase orders.</td></tr>}
          </tbody>
        </Table>
      </Card>

      {!!open && <DrawerPO initial={Object.keys(open).length?open:null} vendors={vendors} onClose={()=>setOpen(null)} />}
    </PageShell>
  );
}
