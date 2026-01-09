import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

const Card = styled.div`
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  padding: 16px; color: #e7efff;
`;
const Row = styled.div`display:flex; gap:12px; align-items:center; flex-wrap:wrap;`;
const Input = styled.input`
  background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
  border-radius:10px; padding:10px; color:#e7efff;
`;
const Select = styled.select`
  background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
  border-radius:10px; padding:10px; color:#e7efff; color-scheme: dark;
`;
const Button = styled.button`
  background:#4ea1ff; color:#fff; border:0; border-radius:10px; padding:10px 14px;
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
`;
const Danger = styled(Button)`background:#ef4444;`;

const Table = styled.table`
  width:100%; border-collapse:collapse; margin-top:12px; font-size:14px;
  th,td{border-bottom:1px solid rgba(255,255,255,.12); padding:10px;}
  th{color:#b7c6e6; text-align:left;}
`;

export default function DeliveryBoyManager() {
    const [rows, setRows] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    async function load() {
        const qs = await getDocs(query(collection(db, "deliveryBoys"), orderBy("name")));
        setRows(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    useEffect(() => { load(); }, []);

    async function add() {
        if (!name.trim() || !phone.trim()) return alert("Enter name & phone");
        await addDoc(collection(db, "deliveryBoys"), {
            name: name.trim(),
            phone: phone.trim(),
            isActive: true,
            assignedCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        setName(""); setPhone(""); load();
    }

    async function toggleActive(id, isActive) {
        await updateDoc(doc(db, "deliveryBoys", id), {
            isActive: !isActive,
            updatedAt: serverTimestamp()
        });
        load();
    }

    async function remove(id) {
        if (!window.confirm("Delete this delivery boy?")) return;
        await deleteDoc(doc(db, "deliveryBoys", id));
        load();
    }

    return (
        <Card>
            <h3 style={{ marginTop: 0 }}>Delivery Boys</h3>
            <Row>
                <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                <Button onClick={add}><FiPlus /> Add</Button>
            </Row>

            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Active</th>
                        <th>Assigned</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id}>
                            <td>{r.name}</td>
                            <td>{r.phone}</td>
                            <td>{r.isActive ? "Yes" : "No"}</td>
                            <td>{r.assignedCount ?? 0}</td>
                            <td style={{ display: "flex", gap: 8 }}>
                                <Button onClick={() => toggleActive(r.id, r.isActive)}>
                                    <FiSave />{r.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Danger onClick={() => remove(r.id)}><FiTrash2 /> Delete</Danger>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card>
    );
}
