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
      },
      {
        type: "group",
        label: "Setoran Sampah",
        icon: "FileText",
        items: [
          {
            href: "/laporan/bank-sampah",
            label: "Setoran Bank Sampah",
            icon: "Coins",
          },
          {
            href: "/laporan/warmiendo",
            label: "Setoran Warmiendo",
            icon: "ShoppingBag",
          },
          {
            href: "/laporan/konsumen",
            label: "Setoran Konsumen",
            icon: "User",
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
