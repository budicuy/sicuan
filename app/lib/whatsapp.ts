import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";

export interface WhatsAppSession {
  client: Client | null;
  qrCode: string | null;
  status:
    | "disconnected"
    | "connecting"
    | "qr_ready"
    | "authenticated"
    | "ready";
  errorMsg: string | null;
}

// Attach the session to the Node global object to survive Next.js hot-reloads
const globalForWhatsApp = global as unknown as {
  whatsappSession?: WhatsAppSession;
};

if (!globalForWhatsApp.whatsappSession) {
  globalForWhatsApp.whatsappSession = {
    client: null,
    qrCode: null,
    status: "disconnected",
    errorMsg: null,
  };
}

export const whatsappSession = globalForWhatsApp.whatsappSession;

export async function initWhatsApp() {
  if (whatsappSession.client) {
    return whatsappSession;
  }

  console.log("Starting WhatsApp Client using system Chrome...");
  whatsappSession.status = "connecting";
  whatsappSession.qrCode = null;
  whatsappSession.errorMsg = null;

  try {
    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: "./.wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        executablePath: "/usr/bin/google-chrome-stable", // Use system Chrome directly
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    client.on("qr", async (qr) => {
      try {
        whatsappSession.qrCode = await qrcode.toDataURL(qr);
        whatsappSession.status = "qr_ready";
        whatsappSession.errorMsg = null;
        console.log("WhatsApp QR Code generated and converted to base64.");
      } catch (err) {
        console.error("Error generating QR code base64:", err);
      }
    });

    client.on("authenticated", () => {
      whatsappSession.qrCode = null;
      whatsappSession.status = "authenticated";
      whatsappSession.errorMsg = null;
      console.log("WhatsApp Authenticated!");
    });

    client.on("ready", () => {
      whatsappSession.qrCode = null;
      whatsappSession.status = "ready";
      whatsappSession.errorMsg = null;
      console.log("WhatsApp Client Ready!");
    });

    client.on("auth_failure", (msg) => {
      whatsappSession.qrCode = null;
      whatsappSession.status = "disconnected";
      whatsappSession.errorMsg = `Otentikasi gagal: ${msg}`;
      whatsappSession.client = null;
      console.error("WhatsApp Auth Failure:", msg);
    });

    client.on("disconnected", (reason) => {
      whatsappSession.qrCode = null;
      whatsappSession.status = "disconnected";
      whatsappSession.errorMsg = `Terputus: ${reason}`;
      whatsappSession.client = null;
      console.log("WhatsApp Client disconnected:", reason);
    });

    client.initialize().catch((err) => {
      console.error("Error initializing client inside promise:", err);
      whatsappSession.status = "disconnected";
      whatsappSession.errorMsg = String(err);
      whatsappSession.client = null;
    });

    whatsappSession.client = client;
  } catch (error) {
    console.error("Error starting WhatsApp client:", error);
    whatsappSession.status = "disconnected";
    whatsappSession.errorMsg = String(error);
    whatsappSession.client = null;
  }

  return whatsappSession;
}

export async function disconnectWhatsApp() {
  if (whatsappSession.client) {
    try {
      await whatsappSession.client.destroy();
    } catch (e) {
      console.error("Error destroying client:", e);
    }
    whatsappSession.client = null;
    whatsappSession.qrCode = null;
    whatsappSession.status = "disconnected";
    whatsappSession.errorMsg = null;
    console.log("WhatsApp Client destroyed.");
  }
}
