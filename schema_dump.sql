-- Generated Schema Dump (Tables and Columns Only)

-- Migration File: 0000_jazzy_mockingbird.sql
CREATE TYPE "public"."kupon_tier" AS ENUM('silver', 'gold', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."raw_material_kategori" AS ENUM('Cup', 'Etiket', 'Karton');--> statement-breakpoint
CREATE TYPE "public"."raw_material_klasifikasi" AS ENUM('Cup Noodle (CN)', 'Glass Noodle (GN)', 'Normal Noodle (NN)');--> statement-breakpoint
CREATE TYPE "public"."jenis_sampah" AS ENUM('Karton', 'Etiket', 'Paper Cup');--> statement-breakpoint
CREATE TYPE "public"."status_setor" AS ENUM('pending', 'diverifikasi', 'diserahkan', 'diterima', 'ditolak');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin', 'konsumen', 'warmiendo', 'bank-sampah');--> statement-breakpoint
CREATE TABLE "ekspedisi" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_vendor" text NOT NULL,
	"no_telepon" text NOT NULL,
	"status" text DEFAULT 'Aktif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harga_sampah" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" date NOT NULL,
	"jenis_sampah" text NOT NULL,
	"harga_per_kg" integer NOT NULL,
	"point_per_kg" integer NOT NULL,
	"berat_min" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kupon" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text NOT NULL,
	"poin" double precision NOT NULL,
	"tier" "kupon_tier" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nasabah" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nik" text,
	"tanggal_lahir" text,
	"no_telepon" text,
	"alamat" text,
	"jenis_bank" text,
	"no_rekening" text,
	"poin" integer DEFAULT 0 NOT NULL,
	"kredit" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nasabah_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pencairan_dana" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"jumlah" integer NOT NULL,
	"jenis_bank" text NOT NULL,
	"no_rekening" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bukti_transfer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penukaran_kupon" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kupon_id" integer NOT NULL,
	"kode_unik" text NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"tanggal_gunakan" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "penukaran_kupon_kode_unik_unique" UNIQUE("kode_unik")
);
--> statement-breakpoint
CREATE TABLE "raw_material" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" date NOT NULL,
	"kategori" "raw_material_kategori" NOT NULL,
	"klasifikasi" "raw_material_klasifikasi" NOT NULL,
	"berat_kg" double precision NOT NULL,
	"berat_gram" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setoran_bank_sampah" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_setor" text NOT NULL,
	"user_id" integer NOT NULL,
	"jenis_sampah" "jenis_sampah" NOT NULL,
	"berat_kg" double precision NOT NULL,
	"berat_ai_kg" double precision,
	"tanggal_setor" date NOT NULL,
	"foto_timbangan" text NOT NULL,
	"foto_bukti_tambahan" text[] DEFAULT '{}' NOT NULL,
	"catatan" text,
	"total_poin" integer DEFAULT 0 NOT NULL,
	"status" "status_setor" DEFAULT 'diterima' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setoran_konsumen" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_setor" text NOT NULL,
	"user_id" integer NOT NULL,
	"jenis_sampah" "jenis_sampah" NOT NULL,
	"berat_kg" double precision NOT NULL,
	"berat_ai_kg" double precision,
	"tanggal_setor" date NOT NULL,
	"foto_timbangan" text NOT NULL,
	"foto_bukti_tambahan" text[] DEFAULT '{}' NOT NULL,
	"catatan" text,
	"total_poin" integer DEFAULT 0 NOT NULL,
	"status" "status_setor" DEFAULT 'diterima' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setoran_warmiendo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_setor" text NOT NULL,
	"user_id" integer NOT NULL,
	"jenis_sampah" "jenis_sampah" NOT NULL,
	"berat_kg" double precision NOT NULL,
	"berat_ai_kg" double precision,
	"tanggal_setor" date NOT NULL,
	"foto_timbangan" text NOT NULL,
	"foto_bukti_tambahan" text[] DEFAULT '{}' NOT NULL,
	"catatan" text,
	"total_poin" integer DEFAULT 0 NOT NULL,
	"status" "status_setor" DEFAULT 'diterima' NOT NULL,
	"metode_setor" text DEFAULT 'ekspedisi' NOT NULL,
	"ekspedisi_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" NOT NULL,
	"status" text DEFAULT 'Aktif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pencairan_dana" ADD CONSTRAINT "pencairan_dana_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penukaran_kupon" ADD CONSTRAINT "penukaran_kupon_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penukaran_kupon" ADD CONSTRAINT "penukaran_kupon_kupon_id_kupon_id_fk" FOREIGN KEY ("kupon_id") REFERENCES "public"."kupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_bank_sampah" ADD CONSTRAINT "setoran_bank_sampah_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_konsumen" ADD CONSTRAINT "setoran_konsumen_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_warmiendo" ADD CONSTRAINT "setoran_warmiendo_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran_warmiendo" ADD CONSTRAINT "setoran_warmiendo_ekspedisi_id_ekspedisi_id_fk" FOREIGN KEY ("ekspedisi_id") REFERENCES "public"."ekspedisi"("id") ON DELETE set null ON UPDATE no action;

