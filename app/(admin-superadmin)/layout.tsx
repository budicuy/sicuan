import { count, eq, or } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarLayout } from "@/app/components/shared/sidebar";
import { db } from "@/db";
import {
  pencairanDana,
  setorSampahBankSampah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
} from "@/db/schema";

async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

interface LayoutProps {
  children: React.ReactNode;
}

export default async function AdminSuperadminLayout({ children }: LayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: { name: string; role: string; username: string } | null = null;
  try {
    user = decodeJwt(token) as { name: string; role: string; username: string };
  } catch (error) {
    console.error("JWT decoding failed in admin layout:", error);
    redirect("/login");
  }

  // Auth Guard
  if (user.role !== "admin" && user.role !== "superadmin") {
    if (user.role === "konsumen") {
      redirect("/dashboard");
    } else if (user.role === "bank-sampah") {
      redirect("/dashboard/bank-sampah-dashboard");
    } else if (user.role === "warmiendo") {
      redirect("/dashboard/warmiendo-dashboard");
    } else {
      redirect("/login");
    }
  }

  // Fetch pending setoran counts
  const [pendingBankSampah] = await db
    .select({ count: count() })
    .from(setorSampahBankSampah)
    .where(eq(setorSampahBankSampah.status, "pending"));

  const [pendingWarmiendo] = await db
    .select({ count: count() })
    .from(setorSampahWarmiendo)
    .where(
      or(
        eq(setorSampahWarmiendo.status, "pending"),
        eq(setorSampahWarmiendo.status, "diserahkan"),
      ),
    );

  const [pendingKonsumen] = await db
    .select({ count: count() })
    .from(setorSampahKonsumen)
    .where(eq(setorSampahKonsumen.status, "pending"));

  const countBankSampah = pendingBankSampah?.count ?? 0;
  const countWarmiendo = pendingWarmiendo?.count ?? 0;
  const countKonsumen = pendingKonsumen?.count ?? 0;
  const totalPending = countBankSampah + countWarmiendo + countKonsumen;

  // Fetch pending pencairan dana count
  const [pendingPencairan] = await db
    .select({ count: count() })
    .from(pencairanDana)
    .where(eq(pencairanDana.status, "pending"));

  const countPencairan = pendingPencairan?.count ?? 0;

  const sidebarItems: import("@/app/components/shared/sidebar").SidebarItem[] =
    [
      {
        type: "link",
        href: "/dashboard/admin-dashboard",
        label: "Ringkasan",
        icon: "LayoutDashboard",
      },
      {
        type: "group",
        label: "Master Data",
        icon: "Folder",
        items: [
          { href: "/users", label: "Data User", icon: "User" },
          { href: "/nasabah", label: "Data Nasabah", icon: "Coins" },
          { href: "/ekspedisi", label: "Data Ekspedisi", icon: "FileText" },
          { href: "/harga-sampah", label: "Harga Sampah", icon: "Settings" },
          { href: "/poin", label: "Master Poin", icon: "Star" },
          { href: "/raw-material", label: "Raw Material", icon: "Recycle" },
          { href: "/kupon", label: "Master Kupon", icon: "Star" },
        ],
      },
      {
        type: "link",
        href: "/pencairan-dana",
        label: "Pencairan Dana",
        icon: "Coins",
        badgeCount: countPencairan,
      },
      {
        type: "group",
        label: "Setoran Sampah",
        icon: "FileText",
        badgeCount: totalPending,
        items: [
          {
            href: "/laporan/bank-sampah",
            label: "Setoran Bank Sampah",
            icon: "Coins",
            badgeCount: countBankSampah,
          },
          {
            href: "/laporan/warmiendo",
            label: "Setoran Warmiendo",
            icon: "ShoppingBag",
            badgeCount: countWarmiendo,
          },
          {
            href: "/laporan/konsumen",
            label: "Setoran Konsumen",
            icon: "User",
            badgeCount: countKonsumen,
          },
        ],
      },
      {
        type: "link",
        href: "/laporan/raw-material",
        label: "Laporan Setoran",
        icon: "Recycle",
      },
      {
        type: "link",
        href: "/peta-sampah",
        label: "Peta Sampah",
        icon: "Map",
      },
      {
        type: "link",
        href: "/user-guide",
        label: "User Guide",
        icon: "BookOpen",
      },
    ];

  return (
    <SidebarLayout
      user={user}
      onLogout={logoutAction}
      menuItems={[]}
      sidebarItems={sidebarItems}
    >
      {children}
    </SidebarLayout>
  );
}
