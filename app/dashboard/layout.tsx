import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "../components/dashboard-layout-wrapper";
import { logoutAction } from "./action";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // Protect route
  if (!token) {
    redirect("/login");
  }

  let user: { name: string; role: string; username: string } | null = null;
  try {
    user = decodeJwt(token) as { name: string; role: string; username: string };
  } catch (error) {
    console.error("JWT decoding failed in dashboard layout:", error);
    redirect("/login");
  }

  return (
    <DashboardLayoutWrapper user={user} onLogout={logoutAction}>
      {children}
    </DashboardLayoutWrapper>
  );
}
