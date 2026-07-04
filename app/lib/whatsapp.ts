import fs from "node:fs";
import path from "node:path";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { eq, ne } from "drizzle-orm";
import pino from "pino";
import qrcode from "qrcode";
import { db } from "@/db";
import { whatsappSessionTable } from "@/db/schema";

export interface WhatsAppSession {
  // biome-ignore lint/suspicious/noExplicitAny: baileys socket object
  sock: any | null;
  qrCode: string | null;
  status:
    | "disconnected"
    | "connecting"
    | "qr_ready"
    | "authenticated"
    | "ready";
  errorMsg: string | null;
}

// Global singleton to survive Next.js hot-reloads
const globalForWhatsApp = global as unknown as {
  whatsappSession?: WhatsAppSession;
};

if (!globalForWhatsApp.whatsappSession) {
  globalForWhatsApp.whatsappSession = {
    sock: null,
    qrCode: null,
    status: "disconnected",
    errorMsg: null,
  };
}

export const whatsappSession = globalForWhatsApp.whatsappSession;
const authDir = "/tmp/baileys_auth";

// Database Session Load
async function loadSessionFromDb(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Clean up any bloated non-creds files from previous versions in the database
  try {
    await db
      .delete(whatsappSessionTable)
      .where(ne(whatsappSessionTable.fileName, "creds.json"));
  } catch (e) {
    console.error("Error cleaning up bloated database rows:", e);
  }

  // Only load the main credentials file
  const files = await db
    .select()
    .from(whatsappSessionTable)
    .where(eq(whatsappSessionTable.fileName, "creds.json"));

  for (const f of files) {
    const filePath = path.join(dir, f.fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(f.fileContent, "base64"));
  }
  console.log(`Restored core WhatsApp credentials (creds.json) from Neon DB.`);
}

// Database Session Save
async function saveSessionToDb(dir: string) {
  const filePath = path.join(dir, "creds.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath).toString("base64");
      await db
        .insert(whatsappSessionTable)
        .values({
          fileName: "creds.json",
          fileContent: content,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: whatsappSessionTable.fileName,
          set: {
            fileContent: content,
            updatedAt: new Date(),
          },
        });
      console.log("Synchronized WhatsApp creds.json to Neon DB.");
    } catch (error) {
      console.error("Error saving creds.json to database:", error);
    }
  }
}

// Database Session Clear
async function clearSessionDb(dir: string) {
  await db.delete(whatsappSessionTable);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log("Cleared WhatsApp session from Neon DB and local disk.");
}

export async function initWhatsApp() {
  if (whatsappSession.sock) {
    return whatsappSession;
  }

  console.log("Initializing Baileys WhatsApp Client...");
  whatsappSession.status = "connecting";
  whatsappSession.qrCode = null;
  whatsappSession.errorMsg = null;

  try {
    // 1. Restore core session from database
    await loadSessionFromDb(authDir);

    // 2. Load Multi-File Auth
    // biome-ignore lint/correctness/useHookAtTopLevel: useMultiFileAuthState is a backend Baileys authentication builder, not a React Hook
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    // 3. Initialize Baileys
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      // biome-ignore lint/suspicious/noExplicitAny: pino logger typecast
      logger: pino({ level: "silent" }) as any,
      browser: ["Sicuan Bank Sampah", "Chrome", "1.0.0"],
    });

    // 4. Handle creds update
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      await saveSessionToDb(authDir);
    });

    // 5. Handle connection updates
    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        try {
          whatsappSession.qrCode = await qrcode.toDataURL(qr);
          whatsappSession.status = "qr_ready";
          whatsappSession.errorMsg = null;
          console.log("New WhatsApp QR Code generated.");
        } catch (err) {
          console.error("Failed to generate QR base64:", err);
        }
      }

      if (connection === "connecting") {
        whatsappSession.status = "connecting";
      }

      if (connection === "open") {
        whatsappSession.status = "ready";
        whatsappSession.qrCode = null;
        whatsappSession.errorMsg = null;
        console.log("WhatsApp Connection successfully opened!");
        await saveSessionToDb(authDir); // Sync credentials to DB
      }

      if (connection === "close") {
        // biome-ignore lint/suspicious/noExplicitAny: lastDisconnect error typecast
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `Connection closed. StatusCode: ${statusCode}. Reconnecting: ${shouldReconnect}`,
        );

        whatsappSession.sock = null;
        whatsappSession.qrCode = null;

        if (shouldReconnect) {
          whatsappSession.status = "connecting";
          // Reconnect dynamically
          setTimeout(initWhatsApp, 2000);
        } else {
          whatsappSession.status = "disconnected";
          whatsappSession.errorMsg = "Logged out from WhatsApp device.";
          await clearSessionDb(authDir);
        }
      }
    });

    whatsappSession.sock = sock;
  } catch (error) {
    console.error("Error starting Baileys client:", error);
    whatsappSession.status = "disconnected";
    whatsappSession.errorMsg = String(error);
    whatsappSession.sock = null;
  }

  return whatsappSession;
}

export async function disconnectWhatsApp() {
  if (whatsappSession.sock) {
    try {
      await whatsappSession.sock.logout();
    } catch (e) {
      console.error("Error logging out Baileys:", e);
    }
    whatsappSession.sock = null;
    await clearSessionDb(authDir);
    whatsappSession.status = "disconnected";
    whatsappSession.qrCode = null;
    whatsappSession.errorMsg = null;
    console.log("WhatsApp Session cleared.");
  }
}
