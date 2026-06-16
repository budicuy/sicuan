import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarLayout } from "@/app/components/shared/sidebar";

async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

interface LayoutProps {
  children: React.ReactNode;
}

export default async function KonsumenLayout({ children }: LayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: { name: string; role: string; username: string } | null = null;
  try {
    user = decodeJwt(token) as { name: string; role: string; username: string };
  } catch (error) {
    console.error("JWT decoding failed in konsumen layout:", error);
    redirect("/login");
  }

  // Auth Guard
  if (user.role !== "konsumen") {
    // Redirect to correct dashboard
    if (user.role === "admin" || user.role === "superadmin") {
      redirect("/dashboard/admin-dashboard");
    } else if (user.role === "bank-sampah") {
      redirect("/dashboard/bank-sampah-dashboard");
    } else if (user.role === "warmiendo") {
      redirect("/dashboard/warmiendo-dashboard");
    } else {
      redirect("/login");
    }
  }

  const menuItems = [
    { href: "/dashboard", label: "Ringkasan", icon: "LayoutDashboard" },
    { href: "/laporan", label: "Laporan Setoran", icon: "FileText" },
    { href: "/setor-sampah", label: "Setor Sampah", icon: "ShoppingBag" },
    { href: "/tukar-kupon", label: "Tukar Kupon", icon: "Star" },
    { href: "/profil", label: "Profil Saya", icon: "User" },
    {
      href: "/peta-jalan-sampah/konsumen",
      label: "Peta Jalan Sampah",
      icon: "Map",
    },
    {
      href: "/user-guide/konsumen-guide",
      label: "Panduan",
      icon: "BookOpen",
    },
  ];

  return (
    <SidebarLayout user={user} onLogout={logoutAction} menuItems={menuItems}>
      {children}
    </SidebarLayout>
  );
}
