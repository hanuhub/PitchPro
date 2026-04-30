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
  if (roles) {
    // Backward-compat: treat legacy "admin" as "platform_admin"
    const role = user.role === "admin" ? "platform_admin" : user.role;
    const accept = roles.flatMap((r) => r === "admin" ? ["admin", "platform_admin", "academy_admin"] : [r]);
    if (!accept.includes(role)) return <Navigate to="/dashboard" replace />;
  }
  return children;
}
