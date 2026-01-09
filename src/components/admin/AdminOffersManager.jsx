// src/components/admin/AdminOffersManager.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db, storage } from "../../firebase/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiRefreshCw } from "react-icons/fi";

/* ===== Admin glass tokens (same as your other admin screens) ===== */
const C = {
  glass: 'rgba(255,255,255,.06)',
  glassBorder: 'rgba(255,255,255,.12)',
  glassHeader: 'rgba(255,255,255,.10)',
  text: '#e7efff',
  subtext: '#b7c6e6',
  ring: '#78c7ff',
  primary: '#4ea1ff',
  danger: '#ef4444',
  bg: '#0b1220',
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Wrap = styled.div`
  background:${C.bg}; color:${C.text};
  padding: clamp(16px,3vw,24px); border:1px solid ${C.glassBorder};
  border-radius:14px; margin:18px auto; max-width:1280px;
`;
const Head = styled.div`display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; h2{margin:0; font-size:20px}`;
const Row = styled.div`display:flex; gap:12px; flex-wrap:wrap; align-items:center;`;
const Button = styled.button`
  background:${p=>p.$danger?C.danger:C.primary}; color:#fff; border:none; border-radius:10px; padding:10px 12px; cursor:pointer;
  display:inline-flex; align-items:center; gap:8px; &:disabled{opacity:.6; cursor:not-allowed}
`;
const SmallBtn = styled.button`
  background:${C.glassHeader}; color:${C.text}; border:1px solid ${C.glassBorder}; border-radius:10px; padding:8px 10px; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px;
`;
const Input = styled.input`
  background:${C.glassHeader}; color:${C.text}; border:1px solid ${C.glassBorder}; border-radius:10px; padding:9px 10px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} }
`;
const Select = styled.select`
  background:${C.glassHeader}; color:${C.text}; border:1px solid ${C.glassBorder}; border-radius:10px; padding:9px 10px; color-scheme: dark;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} }
  option{ background:#121a2b; color:${C.text}; }
`;
const Table = styled.table`
  width:100%; border-collapse:collapse; margin-top:12px; font-size:14px; animation:${fade} .35s both;
  th,td{border-bottom:1px solid ${C.glassBorder}; padding:10px; vertical-align:top}
  th{text-align:left; color:${C.subtext}; font-weight:600}
  td img{width:120px; height:80px; object-fit:cover; border-radius:10px; border:1px solid ${C.glassBorder}}
`;
const Card = styled.div`
  margin-top:12px; padding:12px; border:1px solid ${C.glassBorder}; border-radius:12px; background:${C.glassHeader};
`;
const Label = styled.label`font-size:12px; color:${C.subtext}; display:block; margin-bottom:6px;`;

const Bar = styled.div`
  height:6px; background:rgba(255,255,255,.08); border-radius:6px; overflow:hidden; margin-top:6px;
  > div{height:100%; background:${C.primary}}
`;

const slug = (s="") =>
  s.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"").replace(/\-+/g,"-").replace(/^\-+|\-+$/g,"");

export default function AdminOffersManager(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load(){
    setLoading(true);
    try{
      const s = await getDocs(query(collection(db,"siteOffers"), orderBy("order","asc")));
      setRows(s.docs.map(d=>({id:d.id, ...d.data()})));
    }finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  async function removeOffer(o){
    if (!window.confirm("Delete this offer?")) return;
    try{ if (o.imagePath) await deleteObject(ref(storage, o.imagePath)); } catch {}
    await deleteDoc(doc(db,"siteOffers", o.id));
    setRows(prev => prev.filter(r => r.id!==o.id));
  }

  async function saveOffer(payload){
    if (!payload.id){
      const refDoc = await addDoc(collection(db,"siteOffers"), payload);
      setRows(prev => [{id:refDoc.id, ...payload}, ...prev]);
    }else{
      const { id, ...rest } = payload;
      await updateDoc(doc(db,"siteOffers", id), rest);
      setRows(prev => prev.map(r => r.id===id ? payload : r));
    }
    setEditing(null);
  }

  return (
    <Wrap>
      <Head>
        <h2>Admin · Offers</h2>
        <Row>
          <SmallBtn onClick={load}><FiRefreshCw/> Refresh</SmallBtn>
          <Button onClick={()=> setEditing({
            title:"", linkUrl:"", active:true, order:999, imageUrl:"", imagePath:""
          })}><FiPlus/> Add Offer</Button>
        </Row>
      </Head>

      {loading && <div style={{color:C.subtext}}>Loading…</div>}
      {!loading && rows.length===0 && <div style={{color:C.subtext}}>No offers yet.</div>}

      {!loading && rows.length>0 && (
        <Table>
          <thead>
            <tr><th>Preview</th><th>Title</th><th>Link</th><th>Order</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(o=>(
              <tr key={o.id}>
                <td>{o.imageUrl ? <img src={o.imageUrl} alt="" /> : <div style={{width:120,height:80,background:"#111827",borderRadius:10}}/>}</td>
                <td style={{fontWeight:700}}>{o.title || "—"}</td>
                <td style={{color:C.subtext, fontSize:12}}>{o.linkUrl || "—"}</td>
                <td>{o.order ?? 999}</td>
                <td>{o.active ? "Yes":"No"}</td>
                <td>
                  <Row>
                    <SmallBtn onClick={()=>setEditing(o)}><FiEdit2/> Edit</SmallBtn>
                    <SmallBtn onClick={()=>removeOffer(o)}><FiTrash2/> Delete</SmallBtn>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {editing && (
        <Editor offer={editing} onClose={()=>setEditing(null)} onSave={saveOffer} />
      )}
    </Wrap>
  );
}

function Editor({ offer, onSave, onClose }){
  const [form, setForm] = useState(offer);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [prog, setProg] = useState(0);
  const fileRef = useRef();
  const set = (k,v)=> setForm(prev=>({...prev,[k]:v}));

  const preview = file ? URL.createObjectURL(file) : (form.imageUrl || "");

  async function uploadIfNeeded(){
    if (!file) return { url: form.imageUrl || "", path: form.imagePath || "" };
    try{ if (form.imagePath) await deleteObject(ref(storage, form.imagePath)); }catch{}
    const path = `offers/${Date.now()}-${slug(file.name)}`;
    const r = ref(storage, path);
    setUploading(true); setProg(0);
    const task = uploadBytesResumable(r, file, { cacheControl:"public,max-age=31536000" });
    await new Promise((res, rej)=> {
      task.on("state_changed",
        s=> setProg(Math.round((s.bytesTransferred/s.totalBytes)*100)),
        rej, res
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    setUploading(false);
    return { url, path };
  }

  async function handleSave(){
    const { url, path } = await uploadIfNeeded();
    onSave({
      ...form,
      imageUrl: url, imagePath: path,
      order: Number(form.order||0),
      active: !!form.active,
    });
  }

  return (
    <Card>
      <Row style={{justifyContent:"space-between"}}>
        <h3 style={{margin:0}}>Edit Offer</h3>
        <SmallBtn onClick={onClose}><FiX/> Close</SmallBtn>
      </Row>

      <Row style={{marginTop:8}}>
        <div style={{flex:2}}>
          <Label>Title (shown on pill/alt)</Label>
          <Input value={form.title} onChange={e=>set("title", e.target.value)} placeholder="DEAL OF THE DAY / AVOCADO OIL / …" />
        </div>
        <div style={{flex:2}}>
          <Label>Link URL (optional)</Label>
          <Input value={form.linkUrl||""} onChange={e=>set("linkUrl", e.target.value)} placeholder="/category/oils" />
        </div>
        <div style={{flex:1}}>
          <Label>Order</Label>
          <Input type="number" value={form.order||0} onChange={e=>set("order", Number(e.target.value))} />
        </div>
        <div style={{flex:1}}>
          <Label>Active</Label>
          <Select value={form.active ? "1":"0"} onChange={e=>set("active", e.target.value==="1")}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Select>
        </div>
      </Row>

      <Row style={{marginTop:12, alignItems:"end"}}>
        <div style={{flex:3}}>
          <Label>Banner Image</Label>
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
          {uploading && (
            <div style={{marginTop:8, fontSize:12}}>
              <FiUpload/> Uploading… {prog}%
              <Bar><div style={{width:`${prog}%`}}/></Bar>
            </div>
          )}
          {!!file && (
            <div style={{marginTop:8}}>
              <SmallBtn onClick={()=>{ setFile(null); if (fileRef.current) fileRef.current.value=""; }}><FiX/> Clear selected</SmallBtn>
            </div>
          )}
        </div>
        <div style={{flex:2}}>
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{width:"100%", aspectRatio:"5/3", objectFit:"cover", borderRadius:12, border:`1px solid ${C.glassBorder}`}}
            />
          ) : (
            <div style={{width:"100%", aspectRatio:"5/3", borderRadius:12, border:`1px solid ${C.glassBorder}`, background:"#111827"}}/>
          )}
        </div>
      </Row>

      <Row style={{justifyContent:"flex-end", marginTop:12}}>
        <SmallBtn onClick={onClose}><FiX/> Cancel</SmallBtn>
        <Button onClick={handleSave} disabled={uploading}><FiUpload/> Save</Button>
      </Row>
    </Card>
  );
}
