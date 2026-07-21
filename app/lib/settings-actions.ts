"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getCurrentUser } from "./auth-actions";

export interface AppSettingsData {
  id: number;
  disableAiWarmindo: boolean;
  disableAiBankSampah: boolean;
  disableAiKonsumen: boolean;
}

export async function getAppSettings(): Promise<AppSettingsData> {
  try {
    const row = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, 1),
    });

    if (row) {
      return {
        id: row.id,
        disableAiWarmindo: row.disableAiWarmindo,
        disableAiBankSampah: row.disableAiBankSampah,
        disableAiKonsumen: row.disableAiKonsumen,
      };
    }

    // Insert default settings
    const defaultSettings: AppSettingsData = {
      id: 1,
      disableAiWarmindo: false,
      disableAiBankSampah: false,
      disableAiKonsumen: false,
    };

    await db.insert(appSettings).values(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error("Error reading app settings:", error);
    return {
      id: 1,
      disableAiWarmindo: false,
      disableAiBankSampah: false,
      disableAiKonsumen: false,
    };
  }
}

export async function updateAppSettings(
  disableAiWarmindo: boolean,
  disableAiBankSampah: boolean,
  disableAiKonsumen: boolean,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return {
      success: false,
      message: "Akses ditolak. Hanya admin yang dapat mengubah pengaturan.",
    };
  }

  try {
    await db
      .insert(appSettings)
      .values({
        id: 1,
        disableAiWarmindo,
        disableAiBankSampah,
        disableAiKonsumen,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: {
          disableAiWarmindo,
          disableAiBankSampah,
          disableAiKonsumen,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/");
    return { success: true, message: "Pengaturan berhasil diperbarui." };
  } catch (error) {
    console.error("Error updating app settings:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui pengaturan.",
    };
  }
}

export async function checkAiDisabled(
  flowType: "konsumen" | "bank-sampah" | "warmindo",
): Promise<boolean> {
  try {
    const settings = await getAppSettings();
    if (flowType === "konsumen") return settings.disableAiKonsumen;
    if (flowType === "bank-sampah") return settings.disableAiBankSampah;
    if (flowType === "warmindo") return settings.disableAiWarmindo;
    return false;
  } catch (err) {
    console.error("Error checking AI disabled status:", err);
    return false;
  }
}
