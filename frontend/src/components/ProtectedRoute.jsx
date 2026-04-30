import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-muted-foreground">
        <div className="text-sm tracking-[0.3em] uppercase animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!user || user === false) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
