# Next.js Server Actions CRUD Rules

## Folder Structure

Taruh `action.ts` se-folder dengan `page.tsx` (co-location) — JANGAN buat folder `actions/` terpisah:

```
app/
└── contoh/
    ├── page.tsx          # list + modal create/edit/delete
    └── action.ts         # SEMUA actions: create, update, delete
```

### Kenapa cukup dua file:
- Form create & edit ada di dalam modal — tidak perlu route baru
- Logika ID di-pass lewat `.bind()` langsung dari `page.tsx` ke action
- Satu `action.ts` menangani semua operasi CRUD resource yang sama
- JANGAN buat subfolder `new/`, `edit/`, atau `[id]/` — tidak diperlukan

---

## `action.ts` Rules

### Wajib diikuti:
- `"use server"` WAJIB di baris **pertama** file — tidak boleh ada komentar atau import di atasnya
- Setiap action WAJIB validasi input dengan **Zod** sebelum menyentuh database
- Gunakan zod schema dari `drizzle-zod` (`createInsertSchema`) — jangan buat schema manual jika sudah ada
- Selalu gunakan `revalidatePath()` setelah mutasi data
- `redirect()` dipanggil **setelah** `revalidatePath()`, JANGAN di dalam blok `try/catch`
- Semua action WAJIB return shape yang konsisten (lihat bagian Return Value)

### Template file:

```ts
"use server";

import { db } from "@/db";
import { [entities], insert[Entity]Schema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

// Type dari return value action — dipakai sebagai prevState
type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

// ─── CREATE ───────────────────────────────────────────

export async function create[Entity](prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData);

  const parsed = insert[Entity]Schema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .safeParse(raw);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert([entities]).values(parsed.data);
  } catch {
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/[resource]");
  redirect("/[resource]");
}

// ─── UPDATE ───────────────────────────────────────────

export async function update[Entity](id: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData);

  const parsed = insert[Entity]Schema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .safeParse(raw);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.update([entities]).set(parsed.data).where(eq([entities].id, id));
  } catch {
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/[resource]");
  revalidatePath(`/[resource]/${id}`);
  redirect("/[resource]");
}

// ─── DELETE ───────────────────────────────────────────

export async function delete[Entity](id: number): Promise<void> {
  await db.delete([entities]).where(eq([entities].id, id));
  revalidatePath("/[resource]");
}
```

---

## Return Value — Selalu Konsisten

Semua action yang tidak `redirect` WAJIB return salah satu dari tiga shape ini:

```ts
// ✅ Sukses
return { success: true, data: result };

// ✅ Gagal validasi
return { success: false, errors: parsed.error.flatten().fieldErrors };

// ✅ Gagal server error
return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
```

JANGAN throw error langsung ke client — selalu tangkap dan return `{ success: false }`.

---

## Form di `page.tsx` — Tanpa Error State (Server Component)

Gunakan ini jika tidak perlu tampilkan error validasi:

```tsx
import { create[Entity] } from "./action";

export default function New[Entity]Page() {
  return (
    <form action={create[Entity]}>
      <input name="fieldName" required />
      <button type="submit">Simpan</button>
    </form>
  );
}
```

---

## Form di `page.tsx` — Dengan Error State (Client Component)

Gunakan ini jika perlu tampilkan error validasi dari action:

```tsx
"use client";

import { useActionState } from "react";
import { create[Entity] } from "./action";
import type { ActionState } from "./action";

const initialState: ActionState = { success: false, errors: {} };

export default function New[Entity]Page() {
  const [state, formAction] = useActionState(create[Entity], initialState);

  return (
    <form action={formAction}>
      <div>
        <input name="fieldName" />
        {state.errors?.fieldName && (
          <p className="text-red-500">{state.errors.fieldName[0]}</p>
        )}
      </div>

      {/* Error level form */}
      {state.errors?._form && (
        <p className="text-red-500">{state.errors._form[0]}</p>
      )}

      <button type="submit">Simpan</button>
    </form>
  );
}
```

### Aturan `useActionState`:
- Signature action WAJIB `(prevState: ActionState, formData: FormData): Promise<ActionState>` jika dipakai dengan `useActionState`
- `initialState` harus cocok dengan return shape action — gunakan `ActionState` type yang sama
- Komponen WAJIB tambahkan `"use client"` di baris pertama

---

## Delete Action — Gunakan `.bind()`

JANGAN gunakan hidden input untuk passing ID ke delete action. Gunakan `.bind()`:

```tsx
// ✅ BENAR — pakai .bind()
import { delete[Entity] } from "./action";

export default function [Entity]List({ items }) {
  return (
    <ul>
      {items.map((item) => {
        const deleteWithId = delete[Entity].bind(null, item.id);
        return (
          <li key={item.id}>
            {item.name}
            <form action={deleteWithId}>
              <button type="submit">Hapus</button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

// ❌ SALAH — jangan pakai hidden input
<form action={delete[Entity]}>
  <input type="hidden" name="id" value={item.id} />
  <button type="submit">Hapus</button>
</form>
```

---

## Update Action — Bind ID dari Modal di `page.tsx`

Karena pakai modal, form edit langsung ada di `page.tsx` — ID di-pass via `.bind()`:

```tsx
// app/[resource]/page.tsx
import { update[Entity], delete[Entity] } from "./action";

export default async function [Entity]ListPage() {
  const items = await db.select().from([entities]);

  return (
    <ul>
      {items.map((item) => {
        const updateWithId = update[Entity].bind(null, item.id);
        const deleteWithId = delete[Entity].bind(null, item.id);

        return (
          <li key={item.id}>
            <span>{item.name}</span>

            {/* Modal Edit — form langsung di sini */}
            <form action={updateWithId}>
              <input name="name" defaultValue={item.name} />
              <button type="submit">Update</button>
            </form>

            {/* Delete */}
            <form action={deleteWithId}>
              <button type="submit">Hapus</button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
```

---

## `revalidatePath` & `redirect` Rules

```ts
// ✅ BENAR — revalidate dulu, redirect setelahnya
revalidatePath("/users");
redirect("/users");

// ❌ SALAH — redirect di dalam try/catch akan throw error
try {
  await db.insert(users).values(data);
  redirect("/users"); // ← JANGAN di sini
} catch (e) {
  // redirect() throw NEXT_REDIRECT, akan tertangkap catch
}
```

Kapan pakai `revalidatePath`:

| Aksi | Path yang di-revalidate |
|---|---|
| Create | `/[resource]` (list page) |
| Update | `/[resource]` (cukup list page — modal tidak punya route sendiri) |
| Delete | `/[resource]` (list page) |

---

## Checklist Sebelum Commit Action

- [ ] `"use server"` ada di baris pertama file
- [ ] Semua input divalidasi dengan Zod sebelum query DB
- [ ] Return shape konsisten `{ success, errors }` di semua action
- [ ] `redirect()` dipanggil setelah `revalidatePath()`, tidak di dalam `try/catch`
- [ ] Delete action menggunakan `.bind()` bukan hidden input
- [ ] Update action menerima `id` sebagai parameter pertama via `.bind()`
- [ ] Komponen yang pakai `useActionState` sudah `"use client"`
- [ ] Signature action sesuai: `(prevState: ActionState, formData: FormData): Promise<ActionState>` jika dipakai `useActionState`