import { and, count, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarLayout } from "@/app/components/shared/sidebar";
import { db } from "@/db";
import { pencairanDana, setorSampah } from "@/db/schema";

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
    } else if (user.role === "warmindo") {
      redirect("/dashboard/warmindo-dashboard");
    } else {
      redirect("/login");
    }
  }

  // Fetch pending setoran counts
  const [pendingBankSampah] = await db
    .select({ count: count() })
    .from(setorSampah)
    .where(
      and(
        eq(setorSampah.kategoriNasabah, "bank-sampah"),
        eq(setorSampah.status, "pending"),
      ),
    );

  const [pendingWarmindo] = await db
    .select({ count: count() })
    .from(setorSampah)
    .where(
      and(
        eq(setorSampah.kategoriNasabah, "warmindo"),
        eq(setorSampah.status, "pending"),
        eq(setorSampah.metodeSetor, "ekspedisi"),
      ),
    );

  const [pendingKonsumen] = await db
    .select({ count: count() })
    .from(setorSampah)
    .where(
      and(
        eq(setorSampah.kategoriNasabah, "konsumen"),
        eq(setorSampah.status, "pending"),
      ),
    );

  const countBankSampah = pendingBankSampah?.count ?? 0;
  const countWarmindo = pendingWarmindo?.count ?? 0;
  const countKonsumen = pendingKonsumen?.count ?? 0;
  const totalPending = countBankSampah + countWarmindo + countKonsumen;

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
            href: "/laporan/warmindo",
            label: "Setoran Warmindo",
            icon: "ShoppingBag",
            badgeCount: countWarmindo,
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
        href: "/profil/admin-profil",
        label: "Profil Saya",
        icon: "User",
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
