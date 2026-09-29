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

export default async function BankSampahBLayout({ children }: LayoutProps) {
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
    console.error("JWT decoding failed in bank-sampah-b layout:", error);
    redirect("/login");
  }

  // Auth Guard khusus Bank Sampah Tipe B
  if (user.role !== "bank-sampah-b") {
    if (user.role === "konsumen") {
      redirect("/dashboard");
    } else if (user.role === "admin" || user.role === "superadmin") {
      redirect("/dashboard/admin-dashboard");
    } else if (user.role === "bank-sampah") {
      redirect("/dashboard/bank-sampah-dashboard");
    } else if (user.role === "warmindo") {
      redirect("/dashboard/warmindo-dashboard");
    } else {
      redirect("/login");
    }
  }

  const sidebarItems: import("@/app/components/shared/sidebar").SidebarItem[] =
    [
      {
        type: "link",
        href: "/dashboard/bank-sampah-b-dashboard",
        label: "Ringkasan",
        icon: "LayoutDashboard",
      },
      {
        type: "link",
        href: "/setor-sampah/bank-sampah-b-setor",
        label: "Jemput Sampah",
        icon: "Truck",
      },
      {
        type: "link",
        href: "/laporan/bank-sampah-b-laporan",
        label: "Laporan Setoran",
        icon: "FileText",
      },
      {
        type: "link",
        href: "/profil/bank-sampah-b-profil",
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
