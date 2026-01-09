import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const ROLES = ["owner","admin","InventoryManagerAdmin","OrderManagementAdmin","BooksAccountsAdmin","SalesAdmin","user"];

export default function RoleManager() {
  const { role: myRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "users"), orderBy("email")));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  const setRole = async (uid, role) => {
    setBusy(true);
    try {
      const fn = httpsCallable(functions, "setUserRole");
      await fn({ uid, role });
      alert("Role updated. The user must re-login for claim refresh.");
    } finally { setBusy(false); }
  };

  if (!["owner","admin"].includes(myRole)) return null;

  return (
    <div style={{ padding: 16 }}>
      <h3>User Roles</h3>
      <small>Only visible to owner/admin.</small>
      <table style={{ width:"100%", marginTop:12 }}>
        <thead><tr><th align="left">Email</th><th align="left">Name</th><th align="left">Current</th><th>Set</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid || u.id}>
              <td>{u.email}</td>
              <td>{u.displayName}</td>
              <td>{u.role || "user"}</td>
              <td>
                <select defaultValue={u.role || "user"} disabled={busy}
                        onChange={e => setRole(u.uid || u.id, e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
