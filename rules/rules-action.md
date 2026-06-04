# Rules: `action.ts` — Server Actions CRUD

## Aturan Dasar

- `"use server"` WAJIB di baris **pertama** — tidak boleh ada apapun di atasnya
- Satu file `action.ts` menangani **semua** operasi CRUD untuk resource yang sama
- Setiap action WAJIB validasi input dengan Zod **sebelum** menyentuh database
- JANGAN throw error ke client — selalu tangkap dan return `{ success: false }`
- `redirect()` dipanggil **setelah** `revalidatePath()`, JANGAN di dalam `try/catch`

---

## Type `ActionState` — Wajib Didefinisikan & Di-export

Definisikan sekali di `action.ts`, export agar bisa dipakai di komponen:

```ts
export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};
```

---

## Template Lengkap `action.ts`

```ts
"use server";

import { db } from "@/db";
import { [entities], insert[Entity]Schema } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

// Schema untuk create/update — tanpa field yang di-generate DB
const [entity]FormSchema = insert[Entity]Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── CREATE ───────────────────────────────────────────

export async function create[Entity](
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = [entity]FormSchema.safeParse(Object.fromEntries(formData));

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

export async function update[Entity](
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = [entity]FormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update([entities])
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq([entities].id, id));
  } catch {
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/[resource]");
  redirect("/[resource]");
}

// ─── DELETE ───────────────────────────────────────────

export async function delete[Entity](id: number): Promise<void> {
  await db.delete([entities]).where(eq([entities].id, id));
  revalidatePath("/[resource]");
}
```

---

## Query Rules — Mencegah N+1 & Query Buruk

### ❌ N+1: Jangan query di dalam loop

```ts
// ❌ SALAH — N+1: query dijalankan sebanyak jumlah posts
const posts = await db.select().from(posts);
for (const post of posts) {
  const author = await db.select().from(users).where(eq(users.id, post.authorId));
  // query N kali = N+1 problem
}

// ✅ BENAR — satu query dengan join/with
const posts = await db.query.posts.findMany({
  with: { author: true },
});
```

### ❌ Jangan SELECT * lalu filter di JS

```ts
// ❌ SALAH — ambil semua data lalu filter di memori
const all = await db.select().from(users);
const active = all.filter(u => u.status === "active");

// ✅ BENAR — filter di query
const active = await db.select().from(users).where(eq(users.status, "active"));
```

### ❌ Jangan query satu per satu untuk bulk operation

```ts
// ❌ SALAH — N query untuk N item
for (const id of ids) {
  await db.delete(users).where(eq(users.id, id));
}

// ✅ BENAR — satu query dengan inArray
await db.delete(users).where(inArray(users.id, ids));
```

### ❌ Jangan SELECT kolom yang tidak dipakai

```ts
// ❌ SALAH — ambil semua kolom padahal cuma butuh 2
const users = await db.select().from(users);

// ✅ BENAR — pilih kolom yang dibutuhkan saja
const users = await db.select({ id: users.id, name: users.name }).from(users);
```

### ✅ Gunakan `with` untuk relasi, bukan query terpisah

```ts
// ❌ SALAH — dua query terpisah
const post = await db.select().from(posts).where(eq(posts.id, id));
const author = await db.select().from(users).where(eq(users.id, post.authorId));

// ✅ BENAR — satu query dengan relasi
const post = await db.query.posts.findFirst({
  where: eq(posts.id, id),
  with: { author: true },
});
```

### ✅ Gunakan transaksi untuk operasi yang saling bergantung

```ts
// ❌ SALAH — dua operasi terpisah, bisa partial fail
await db.insert(orders).values(orderData);
await db.update(inventory).set({ stock: stock - 1 }).where(eq(inventory.id, itemId));

// ✅ BENAR — dalam satu transaksi, atomic
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData);
  await tx.update(inventory).set({ stock: stock - 1 }).where(eq(inventory.id, itemId));
});
```

---

## Validasi Rules

### Definisikan schema sekali, reuse untuk create & update

```ts
// ✅ Definisikan di atas file, pakai di semua action
const [entity]FormSchema = insert[Entity]Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// JANGAN inline `.omit()` di setiap action — duplikasi
```

### Selalu `safeParse`, bukan `parse`

```ts
// ❌ SALAH — throw error jika invalid, tidak bisa di-handle dengan baik
const data = [entity]FormSchema.parse(raw);

// ✅ BENAR — return result object, bisa dicek success/failure
const parsed = [entity]FormSchema.safeParse(raw);
if (!parsed.success) {
  return { success: false, errors: parsed.error.flatten().fieldErrors };
}
```

---

## `revalidatePath` Rules

Karena pakai modal (tidak ada route edit/detail terpisah), cukup revalidate satu path:

```ts
// ✅ Cukup list page — modal tidak punya route sendiri
revalidatePath("/[resource]");

// ❌ Tidak perlu revalidate path yang tidak ada
revalidatePath("/[resource]/edit");  // route ini tidak ada
```

---

## Return Value — Selalu Konsisten

```ts
// Sukses tanpa redirect
return { success: true };

// Gagal validasi
return { success: false, errors: parsed.error.flatten().fieldErrors };

// Gagal server
return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
```

---

## Checklist Sebelum Commit

- [ ] `"use server"` ada di baris pertama
- [ ] `ActionState` didefinisikan dan di-export
- [ ] Schema form didefinisikan sekali di atas file, dipakai ulang di semua action
- [ ] Semua input pakai `safeParse` — tidak ada `.parse()` telanjang
- [ ] Tidak ada query di dalam loop — gunakan `inArray`, `join`, atau `with`
- [ ] Tidak ada `SELECT *` jika hanya butuh beberapa kolom
- [ ] Operasi yang saling bergantung dibungkus `db.transaction()`
- [ ] `updatedAt: new Date()` di-set manual saat update
- [ ] `redirect()` di luar `try/catch`, setelah `revalidatePath()`
- [ ] Delete pakai `inArray` jika bulk, `eq` jika single