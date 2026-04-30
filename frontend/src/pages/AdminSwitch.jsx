import { useAuth } from "@/contexts/AuthContext";
import AcademyConsole from "@/pages/Admin";
import PlatformConsole from "@/pages/PlatformConsole";

export default function AdminSwitch() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "platform_admin" : user?.role;
  if (role === "platform_admin") return <PlatformConsole />;
  return <AcademyConsole />;
}
