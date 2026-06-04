# Project Structure Rules

Struktur folder project ini. Ikuti tanpa deviasi.

```
root/
├── app/
│   ├── components/         # komponen UI yang dipakai lebih dari satu halaman
│   ├── [resource]/         # satu folder per resource/fitur
│   │   ├── page.tsx        # halaman utama (list + modal CRUD)
│   │   └── action.ts       # semua server actions CRUD resource ini
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # halaman root "/"
├── db/
│   ├── schema/
│   │   ├── index.ts        # re-export semua schema, types, enum
│   │   ├── relations.ts    # semua relasi dikumpulkan di sini
│   │   └── [entity].ts     # satu file per tabel
│   ├── seeds/
│   │   ├── index.ts        # urutan eksekusi seeders
│   │   ├── seed.ts         # runner script
│   │   └── [entity].seed.ts
│   ├── index.ts            # koneksi database + export db instance
│   └── schema.ts           # (jangan dipakai) — gunakan db/schema/index.ts
├── .env
├── .gitignore
├── AGENTS.md               # rules untuk AI agent (Codex, dll)
├── biome.json              # linter & formatter
├── bun.lock
├── CLAUDE.md               # rules untuk Claude
├── drizzle.config.ts
├── GEMINI.md               # rules untuk Gemini
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── prd.md                  # product requirement document
```

---

## Folder `app/`

- Satu folder per resource/fitur (contoh: `login/`, `users/`, `products/`)
- Setiap folder resource berisi `page.tsx` dan `action.ts` — tidak lebih
- JANGAN buat subfolder `[id]/`, `edit/`, atau `new/` — CRUD pakai modal
- Komponen yang dipakai di lebih dari satu halaman taruh di `app/components/`
- Komponen yang hanya dipakai di satu halaman boleh inline di `page.tsx` atau file terpisah dalam folder yang sama

```
app/
├── components/       # shared components
├── login/
│   ├── page.tsx
│   └── action.ts
├── users/
│   ├── page.tsx
│   └── action.ts
├── layout.tsx
└── page.tsx
```

---

## Folder `db/`

- `db/index.ts` — satu-satunya tempat koneksi database dibuat
- `db/schema/` — satu file per entitas, relasi di `relations.ts`, semua di-export dari `index.ts`
- `db/seeds/` — satu file per entitas seed, runner di `seed.ts`
- `db/schema.ts` — **JANGAN dipakai**, gunakan `db/schema/index.ts`
- Import schema selalu dari `@/db/schema` — bukan dari file entitas langsung

```ts
// ✅ BENAR
import { users } from "@/db/schema";

// ❌ SALAH — import langsung dari file entitas
import { users } from "@/db/schema/users";
```

---

## File Rules di Root

| File | Kegunaan |
|---|---|
| `CLAUDE.md` | Rules & konteks project untuk Claude |
| `AGENTS.md` | Rules untuk AI agent lain (Codex, OpenAI) |
| `GEMINI.md` | Rules untuk Gemini |
| `prd.md` | Product requirement — sumber kebenaran fitur |
| `drizzle.config.ts` | Konfigurasi Drizzle Kit — jangan ubah `out` dan `schema` path |
| `biome.json` | Linter & formatter — jangan pakai ESLint/Prettier bersamaan |
| `.env` | JANGAN commit — semua secrets & DATABASE_URL di sini |

---

## Naming Convention

| Hal | Convention | Contoh |
|---|---|---|
| Folder resource | `kebab-case` | `blog-posts/`, `user-settings/` |
| File halaman | selalu `page.tsx` | `page.tsx` |
| File action | selalu `action.ts` | `action.ts` |
| File schema | `[entity].ts` singular | `user.ts`, `post.ts` |
| File seed | `[entity].seed.ts` | `users.seed.ts` |
| Komponen | `PascalCase.tsx` | `UserCard.tsx` |

---

## Yang Tidak Boleh Dilakukan

- JANGAN buat folder `actions/`, `lib/actions/`, atau `utils/actions/` — action co-location dengan page
- JANGAN buat route `[id]/` untuk edit/detail — gunakan modal
- JANGAN buat file `.env.local` jika sudah ada `.env` — pilih salah satu
- JANGAN install ESLint atau Prettier — project sudah pakai Biome