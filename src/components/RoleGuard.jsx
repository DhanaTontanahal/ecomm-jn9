// src/components/RoleGuard.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function RoleGuard({ allow, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const r = (role || "").toString();
  if (!allow.includes(r)) {
    // Optional: log to debug
    console.warn("RoleGuard blocked. Needed:", allow, "have:", r);
    return <div style={{ padding: 24 }}>Forbidden</div>;
  }
  return <>{children}</>;
}
