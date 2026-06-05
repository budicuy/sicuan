Kamu adalah senior Next.js developer. Tugasmu merombak struktur folder 

project ini agar role-based, maintainable, dan mudah di-debug.



## Konteks Project

Aplikasi pengelolaan sampah dengan stack:

- Next.js (App Router)

- Drizzle ORM

- TypeScript

- Bun



Role user: admin, superadmin, konsumen, bank-sampah, warmiendo



## Struktur Saat Ini

.

├── app

│   ├── components

│   │   ├── ConfirmModal.tsx

│   │   ├── dashboard-layout-wrapper.tsx

│   │   ├── DataTable.tsx

│   │   ├── FeedbackModal.tsx

│   │   ├── FormModal.tsx

│   │   ├── QrModal.tsx

│   │   └── landing-page/          ← semua komponen landing page

│   ├── dashboard/                 ← MASALAH: semua role campur di sini

│   │   ├── ekspedisi/

│   │   ├── harga-sampah/

│   │   ├── kupon/

│   │   ├── laporan/

│   │   │   ├── bank-sampah/

│   │   │   ├── konsumen/

│   │   │   └── warmiendo/

│   │   ├── nasabah/

│   │   ├── pencairan/

│   │   ├── pencairan-dana/

│   │   ├── profil/

│   │   ├── raw-material/

│   │   ├── setor-sampah/ 

│   │   │   ├── bank-sampah.tsx    

│   │   │   ├── konsumen.tsx

│   │   │   └── warmiendo.tsx

│   │   ├── tukar-kupon/

│   │   └── users/

│   ├── kupon-validasi

│   ├── lib/

│   │   ├── gemini-weight-reader.ts

│   │   └── r2.ts

│   ├── page.tsx   

│   ├── layout.tsx

│   └── login/

├── db/

│   ├── schema/

│   └── seeds/

└── rules/                         ← baca semua file di sini sebelum mulai



## Target Arsitektur



app/

├── (konsumen)/

│   ├── layout.tsx          ← sidebar + auth guard khusus konsumen

│   ├── dashboard/page.tsx

│   ├── setor-sampah/

│   │   ├── page.tsx

│   │   └── action.ts

│   ├── tukar-kupon/

│   │   ├── page.tsx

│   │   └── action.ts

│   ├── laporan/

│   └── profil/

│       ├── page.tsx

│       └── action.ts

│

├── (bank-sampah)/

│   ├── layout.tsx   ← sidebar + auth guard khusus bank-sampah

│   ├── dashboard/page.tsx

│   ├── setor-sampah/

│   ├── ajukan-pencairan-dana/

│   ├── laporan/

│   └── profil/

│         

├── (warmiendo)/

│   ├── layout.tsx    ← sidebar + auth guard khusus warmiend

│   ├── dashboard/page.tsx

│   ├── setor-sampah/

│   ├── laporan/

|   ├── ajukan-pencairan-dana/

│   └── profil/

│

├── (admin/superadmin)/

│   ├── layout.tsx

│   ├── dashboard/page.tsx

│   ├── Master Data

│            ├── Data user/

│            ├── Data kupon/

│            ├── Data ekspedisi/

│            ├── Data harga-sampah/

│            ├── Data raw-material/

│            ├── Data kupon

│   ├── Setor-sampah

│            ├── Konsumen

│            ├── Warmiendo

│            ├── Bank sampah

│   └── pencairan-dana/page.tsx

│

├── components/

│   ├── shared/              ← PINDAHKAN komponen yang dipakai 2+ role

│   │   ├── DataTable.tsx    (sudah ada, tinggal pindah)

│   │   ├── ConfirmModal.tsx

│   │   ├── FeedbackModal.tsx

│   │   ├── FormModal.tsx

│   │   ├── QrModal.tsx

│   │   ├── dashboard-layout-wrapper.tsx

│   │   └── contoh.tsx       ← Tambahkan komponen yang banyak berulang kek button, sidebar, chart dll

│   └── landing-page/        ← tidak perlu diubah, sudah terpisah

│

├── lib/                     ← tetap di sini, tidak perlu dipindah

│   ├── gemini-weight-reader.ts

│   └── r2.ts

│

├── validasi-kupon            ← bisa di akses siapa aja tanpa perlu login

├── login/                    ← tetap

├── proxy.ts                  ← BUAT BARU dulunya middleware.ts sekarang berubah ke proxy.ts tapi kode tetap sama

└── globals.css



db/ → JANGAN DIUBAH SAMA SEKALI



## Instruksi Eksekusi



### Pra-Migrasi (wajib dilakukan pertama)

1. Baca semua file di /rules sebelum mulai

2. Baca /app/dashboard/layout.tsx untuk memahami auth yang sudah ada

3. Baca /app/dashboard/action.ts untuk memahami session/role handling

4. Tampilkan hasil analisismu: bagaimana role sekarang di-detect?



### TAHAP 1 — Buat fondasi (tanpa hapus apapun)

1. Buat proxy.ts berdasarkan logika auth yang sudah ada

2. Buat components/shared/ — PINDAH (bukan salin) komponen yang sudah ada

3. Tidak ada page yang dipindah di tahap ini



### TAHAP 2 — Migrasi role konsumen dulu (paling kecil risikonya)

1. Buat folder (konsumen)/ dengan layout.tsx

2. Pindahkan halaman konsumen satu per satu

3. Pastikan action.ts ikut terbawa dengan import path yang diupdate

4. Test: apakah halaman konsumen masih bisa diakses?



### TAHAP 3, 4, 5 — Ulangi untuk bank-sampah, warmiendo, admin

Satu role per tahap.



### TAHAP 6 — Buat Komponen yang berulah
bikin agar Komponen yang di pake berulah agar bisa di pake semua role dan taruh di folder componenent shared

### TAHAP 6 — Clean
konfirmasi saya dulu sebelum menlanjutkan Hapus /dashboard/ lama hanya setelah semua role sudah berfungsi.



## Aturan Keras

- Baca /rules/*.md dulu — ada konvensi khusus project ini yang wajib diikuti

- JANGAN sentuh /db/ sama sekali

- JANGAN ubah nama fungsi di action.ts, hanya pindahkan lokasinya

- Setiap tahap: tunjukkan diff ringkas sebelum eksekusi

- Kalau ada file yang fungsinya tidak jelas, tanya dulu jangan asumsi

- Pertahankan semua import dari db/schema — path-nya tidak berubah



## Mulai

Mulai dari Pra-Migrasi. Baca file-file yang disebutkan, 

lalu tampilkan:
1. Bagaimana role saat ini di-detect (dari layout.tsx / action.ts)

2. Konfirmasi mapping route-ke-role di atas sudah benar atau perlu koreksi

3. Tunggu persetujuan saya sebelum menulis kode apapun