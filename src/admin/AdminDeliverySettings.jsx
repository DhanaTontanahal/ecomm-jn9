import { useEffect, useState } from "react";
import styled from "styled-components";
import {
    doc, getDoc, setDoc, collection, getDocs, query, where, orderBy
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FiSave } from "react-icons/fi";

const Card = styled.div`
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  padding: 16px;
  color: #e7efff;
`;
const Row = styled.div`display:flex; gap:12px; align-items:center; flex-wrap:wrap;`;
const Label = styled.label`min-width: 220px; color:#b7c6e6;`;
const Select = styled.select`
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 10px;
  color: #e7efff; min-width: 300px; color-scheme: dark;
`;
const Checkbox = styled.input``;
const Button = styled.button`
  background:#4ea1ff; color:#fff; border:0; border-radius:10px; padding:10px 14px;
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
`;

export default function AdminDeliverySettings() {
    const [autoAssign, setAutoAssign] = useState(false);
    const [defaultId, setDefaultId] = useState("");
    const [boys, setBoys] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const sRef = doc(db, "settings", "app");
            const sSnap = await getDoc(sRef);
            const s = sSnap.exists() ? sSnap.data() : {};
            setAutoAssign(!!s.autoAssignDelivery);
            setDefaultId(s.defaultDeliveryBoyId || "");

            const qSnap = await getDocs(
                query(collection(db, "deliveryBoys"), where("isActive", "==", true), orderBy("name"))
            );
            setBoys(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);

    async function save() {
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "app"), {
                autoAssignDelivery: autoAssign,
                defaultDeliveryBoyId: autoAssign ? (defaultId || null) : null,
            }, { merge: true });
            alert("Saved delivery settings");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card>
            <h3 style={{ marginTop: 0 }}>Delivery · Auto Assignment</h3>
            <Row>
                <Label>
                    <Checkbox
                        type="checkbox"
                        checked={autoAssign}
                        onChange={e => setAutoAssign(e.target.checked)}
                    />{" "}
                    Auto Assign Orders to Delivery Boy
                </Label>

                {autoAssign && (
                    <Select value={defaultId} onChange={e => setDefaultId(e.target.value)}>
                        <option value="">(No default — use least-loaded)</option>
                        {boys.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.name} — {b.phone}
                            </option>
                        ))}
                    </Select>
                )}

                <Button onClick={save} disabled={saving}><FiSave /> Save</Button>
            </Row>
        </Card>
    );
}
