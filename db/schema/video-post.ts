import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const videoPost = pgTable("video_post", {
  id: serial("id").primaryKey(),
  tipe: text("tipe").notNull().default("video"), // 'video' | 'gambar'
  mediaUrl: text("media_url"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  urutan: integer("urutan").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  judul: text("judul"),
  deskripsi: text("deskripsi").default(""),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertVideoPostSchema = createInsertSchema(videoPost);
export const selectVideoPostSchema = createSelectSchema(videoPost);

export type VideoPost = typeof videoPost.$inferSelect;
export type NewVideoPost = typeof videoPost.$inferInsert;
