import { and, eq, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarLayout } from "@/app/components/shared/sidebar";
import { db } from "@/db";
import { setorSampah } from "@/db/schema";

async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

interface LayoutProps {
  children: React.ReactNode;
}

export default async function WarmindoLayout({ children }: LayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: {
    id: number;
    name: string;
    role: string;
    username: string;
  } | null = null;
  try {
    user = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
  } catch (error) {
    console.error("JWT decoding failed in warmindo layout:", error);
    redirect("/login");
  }

  // Auth Guard
  if (user.role !== "warmindo") {
    if (user.role === "konsumen") {
      redirect("/dashboard");
    } else if (user.role === "admin" || user.role === "superadmin") {
      redirect("/dashboard/admin-dashboard");
    } else if (user.role === "bank-sampah") {
      redirect("/dashboard/bank-sampah-dashboard");
    } else {
      redirect("/login");
    }
  }

  // Ambil jumlah setoran dengan status "diverifikasi" (menunggu penyerahan ke kurir)
  const pendingHandoverCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(setorSampah)
    .where(
      and(
        eq(setorSampah.userId, user.id),
        eq(setorSampah.status, "diverifikasi"),
      ),
    )
    .then((res) => Number(res[0]?.count ?? 0));

  const menuItems = [
    {
      href: "/dashboard/warmindo-dashboard",
      label: "Ringkasan",
      icon: "LayoutDashboard",
    },
    {
      href: "/laporan/warmindo-laporan",
      label: "Laporan Setoran",
      icon: "FileText",
    },
    {
      href: "/setor-sampah/warmindo-setor-sampah",
      label: "Setor Sampah",
      icon: "ShoppingBag",
      badgeCount: pendingHandoverCount,
    },
    {
      href: "/ajukan-pencairan-dana/warmindo-pencairan",
      label: "Pencairan Dana",
      icon: "Coins",
    },
    { href: "/profil/warmindo-profil", label: "Profil Saya", icon: "User" },
  ];

  return (
    <SidebarLayout user={user} onLogout={logoutAction} menuItems={menuItems}>
      {children}
    </SidebarLayout>
  );
}
