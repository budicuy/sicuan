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

export default async function BankSampahLayout({ children }: LayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: { name: string; role: string; username: string } | null = null;
  try {
    user = decodeJwt(token) as { name: string; role: string; username: string };
  } catch (error) {
    console.error("JWT decoding failed in bank-sampah layout:", error);
    redirect("/login");
  }

  // Auth Guard
  if (user.role !== "bank-sampah") {
    if (user.role === "konsumen") {
      redirect("/dashboard");
    } else if (user.role === "admin" || user.role === "superadmin") {
      redirect("/dashboard/admin-dashboard");
    } else if (user.role === "warmiendo") {
      redirect("/dashboard/warmiendo-dashboard");
    } else {
      redirect("/login");
    }
  }

  const menuItems = [
    {
      href: "/dashboard/bank-sampah-dashboard",
      label: "Ringkasan",
      icon: "LayoutDashboard",
    },
    {
      href: "/laporan/bank-sampah-laporan",
      label: "Laporan Setoran",
      icon: "FileText",
    },
    {
      href: "/setor-sampah/bank-sampah-setor-sampah",
      label: "Setor Sampah",
      icon: "ShoppingBag",
    },
    {
      href: "/ajukan-pencairan-dana/bank-sampah-pencairan",
      label: "Pencairan Dana",
      icon: "Coins",
    },
    { href: "/profil/bank-sampah-profil", label: "Profil Saya", icon: "User" },
    {
      href: "/peta-jalan-sampah/bank-sampah",
      label: "Peta Jalan Sampah",
      icon: "Map",
    },
    {
      href: "/user-guide/bank-sampah-guide",
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
