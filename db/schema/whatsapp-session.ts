import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const whatsappSessionTable = pgTable("whatsapp_session", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull().unique(),
  fileContent: text("file_content").notNull(), // text content of the file
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
