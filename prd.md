# PRODUCT REQUIREMENTS DOCUMENT
# SICUAN — Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai

| | |
|---|---|
| **Nama Sistem** | SICUAN (Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai) |
| **Perusahaan** | PT. Indofood CBP Sukses Makmur Tbk — Noodle Division Cabang Banjarmasin |
| **Versi Dokumen** | 1.0 |
| **Tanggal Dibuat** | Juni 2026 |
| **Status** | Draft — Siap untuk Development |

---

## 1. Overview Proyek

### 1.1. Deskripsi Sistem

SICUAN adalah sistem informasi berbasis web yang dirancang untuk mengelola dan memonitoring proses setor sampah anorganik (limbah kemasan produk Indofood). Sistem ini menghubungkan beberapa pihak: konsumen individu, mitra Warmiendo, Bank Sampah, dan admin perusahaan dalam satu platform terintegrasi.

### 1.2. Tujuan Sistem

- Mempermudah proses pencatatan dan monitoring setor sampah anorganik dari berbagai pihak.
- Memberikan reward (poin/uang) kepada pihak yang menyetorkan sampah sebagai insentif.
- Menghasilkan laporan pengelolaan sampah yang akurat dan real-time untuk manajemen.
- Mendukung program keberlanjutan lingkungan PT. Indofood CBP.

### 1.3. Ruang Lingkup

- Aplikasi web yang dapat diakses via browser (desktop dan mobile).
- Mencakup proses setor sampah langsung, via ekspedisi, maupun dari TPS (Tempat Penampungan Sementara).
- Sistem reward: poin dan kupon untuk konsumen; pencairan dana untuk Warmiendo dan Bank Sampah.

---

## 2. Role Pengguna (User Roles)

Sistem menggunakan **Role-Based Access Control (RBAC)**. Terdapat 5 role utama:

| Role | Deskripsi |
|---|---|
| **Superadmin** | Akses penuh ke seluruh sistem, mengelola hak akses semua user. |
| **Admin** | Pengelola utama: monitoring, data master, laporan, tabungan, reward, pencairan dana. |
| **Konsumen** | Individu yang menyetorkan sampah secara langsung; mendapatkan poin dan kupon. |
| **Warmiendo** | Mitra eksternal yang menyetorkan sampah langsung atau via ekspedisi; mendapatkan saldo yang bisa dicairkan. |
| **Bank Sampah** | Mitra eksternal yang mendata dan menyetorkan sampah dari TPS; mendapatkan reward uang tunai. |

---

## 3. Hak Akses per Role (RBAC Detail)

### 3.1. Superadmin

> Tidak ada satu pun akses yang dibatasi untuk Superadmin.

| Hak Akses |
|---|
| ✓ Full access — semua fitur tanpa terkecuali |
| ✓ Monitoring dashboard seluruh role |
| ✓ Mengelola hak akses semua user |
| ✓ Mengelola laporan dan data history seluruh user |
| ✓ Mengakses semua menu: Master Data, Setoran, Laporan, Reward, Pencairan |

---

### 3.2. Admin

> Admin adalah pengelola utama sistem. Bertugas memantau dan mengelola data sampah dari semua pihak.

| Hak Akses |
|---|
| ✓ Monitoring Dashboard (statistik & ringkasan) |
| ✓ Kelola Data Master (Nasabah Bank, Ekspedisi, User, Harga Sampah, Raw Material) |
| ✓ Kelola Setoran Sampah dari semua sumber |
| ✓ Monitor dan generate Laporan Sampah |
| ✓ Kelola Tabungan Nasabah |
| ✓ Kelola Reward Poin Konsumen |
| ✓ Kelola Pencairan Dana Bank Sampah |

---

### 3.3. Konsumen

> Konsumen adalah individu yang menyetorkan sampah di PT. Indofood. Reward berupa poin yang bisa ditukar kupon.

| Hak Akses |
|---|
| ✓ Setor Sampah Langsung (input data sebelum setor) |
| ✓ Lihat Ringkasan Dashboard pribadi |
| ✓ Lihat History dan Laporan setoran pribadi |
| ✓ Update Profile |
| ✓ Tukar Kupon (penukaran poin) |

---

### 3.4. Warmiendo

> Warmiendo adalah mitra eksternal (pembeli produk perusahaan) yang dapat menyetorkan sampah kembali. Reward berupa saldo yang dapat dicairkan.

| Hak Akses |
|---|
| ✓ Setor Sampah Langsung |
| ✓ Setor Sampah Via Ekspedisi (pilihan tambahan) |
| ✓ Lihat Ringkasan Dashboard pribadi |
| ✓ Lihat History dan Laporan setoran pribadi |
| ✓ Update Profile |
| ✓ Pencairan Dana (konversi saldo menjadi uang) |

---

### 3.5. Bank Sampah

> Bank Sampah adalah mitra eksternal yang dikelola pihak ketiga. Bertugas memilah sampah dan memasukkan data ke SICUAN. Reward berupa uang tunai.

| Hak Akses |
|---|
| ✓ Input / Mendata Laporan Setor Sampah dari TPS |
| ✓ Lihat Ringkasan Dashboard |
| ✓ Lihat History dan Laporan setoran |
| ✓ Update Profile |
| ✓ Pencairan Dana (reward uang tunai) |

---

## 4. Fitur Utama Sistem

### 4.1. Metode Setoran Sampah

| Metode | Deskripsi |
|---|---|
| **Setor Langsung** | Konsumen menyetorkan sampah langsung ke PT. Indofood. Input data wajib sebelum setor. |
| **Setor Via Ekspedisi** | Warmiendo mengirimkan sampah menggunakan jasa ekspedisi (vendor terdaftar). |
| **Setor TPS Langsung** | Bank Sampah menyetorkan sampah dari Tempat Penampungan Sementara yang sudah dipilah. |

### 4.2. Sistem Reward

| Role | Reward |
|---|---|
| **Konsumen** | Poin per kg sampah → dapat ditukar kupon (kupon tier berdasarkan jumlah poin) |
| **Warmiendo** | Saldo rupiah per kg sampah → dapat dicairkan ke rekening bank |
| **Bank Sampah** | Uang tunai per kg sampah → dapat dicairkan melalui pengajuan pencairan dana |

---

## 5. Menu & Struktur Data (Admin)

### 5.1. Master Data Nasabah Bank

Data identitas dan rekening bank milik nasabah yang terdaftar di sistem.

| # | Field | Keterangan |
|---|---|---|
| 1 | Nama Lengkap | Diambil otomatis dari data User |
| 2 | NIK | Nomor Induk Kependudukan (opsional) |
| 3 | Tanggal Lahir | |
| 4 | Nomor Telepon | |
| 5 | Alamat Lengkap | |
| 6 | Jenis Bank | Contoh: BCA, BRI, Mandiri (opsional) |
| 7 | Nomor Rekening | Opsional |

---

### 5.2. Master Data Ekspedisi

Daftar vendor ekspedisi yang diizinkan untuk pengiriman sampah via Warmiendo.

| # | Field | Keterangan |
|---|---|---|
| 1 | Nama Vendor Ekspedisi | |
| 2 | Nomor Telepon Vendor | |
| 3 | Status | Aktif / Nonaktif |

---

### 5.3. Master Data User

Manajemen akun user untuk semua role dalam sistem.

| # | Field | Keterangan |
|---|---|---|
| 1 | Nama Lengkap | |
| 2 | Username | Unik, digunakan untuk login |
| 3 | Password | Disimpan dalam format hash (bcrypt) |
| 4 | Role | Superadmin / Admin / Konsumen / Warmiendo / Bank Sampah |
| 5 | Status Akun | Aktif / Nonaktif |

---

### 5.4. Master Data Harga Sampah

Harga dan nilai poin untuk setiap jenis sampah per periode.

| # | Field | Keterangan |
|---|---|---|
| 1 | Periode | Bulan dan Tahun (contoh: Juni 2026) |
| 2 | Jenis Sampah | Paper Cup / Plastik / Karton |
| 3 | Harga per Kg | Dalam Rupiah |
| 4 | Point per Kg | Nilai poin yang diberikan ke konsumen |
| 5 | Berat Minimum | Dalam satuan Kg |

---

### 5.5. Master Data Raw Material

Data bahan baku yang dihasilkan dari proses daur ulang sampah.

| # | Field | Keterangan |
|---|---|---|
| 1 | Periode | Bulan dan Tahun |
| 2 | Kategori Raw Material | |
| 3 | Berat Per Kg | |
| 4 | Berat Per Gram | |

---

### 5.6. Menu Kelola Reward Poin & Pencairan Dana

| Sub-Menu | Deskripsi |
|---|---|
| **Kelola Tier Poin Kupon** | Mengatur threshold poin untuk setiap level/tier kupon konsumen |
| **Kelola Pencairan Dana** | Verifikasi dan approval pengajuan pencairan dari Warmiendo & Bank Sampah |

---

### 5.7. Menu Laporan

| Sub-Menu | Deskripsi |
|---|---|
| **Laporan Nasabah Konsumen** | Per konsumen individu |
| **Laporan Nasabah Bank Sampah** | Per mitra Bank Sampah |
| **Laporan Nasabah Warmiendo** | Per mitra Warmiendo |
| **Semua Laporan Nasabah** | Laporan gabungan, dapat difilter dan diekspor |

---

### 5.8. Menu Kelola Setoran Sampah

| Sub-Menu | Deskripsi |
|---|---|
| **Kelola Setoran Sampah** | CRUD setoran dari semua sumber: Konsumen, Warmiendo, Bank Sampah |
| **Semua Laporan Setoran** | Rekap dan histori lengkap seluruh setoran |

---

## 6. Struktur Menu — Role Konsumen, Warmiendo & Bank Sampah

| Menu | Deskripsi | Konsumen | Warmiendo | Bank Sampah |
|---|---|:---:|:---:|:---:|
| Ringkasan Dashboard | Statistik pribadi: total sampah, saldo/poin, histori terakhir | ✓ | ✓ | ✓ |
| Setor Sampah | Form input data setoran baru | ✓ | ✓ | ✓ |
| Update Profile | Edit data diri, nomor telepon, alamat, info bank | ✓ | ✓ | ✓ |
| Lihat History & Laporan | Histori semua setoran beserta status dan nilainya | ✓ | ✓ | ✓ |
| Penukaran Kupon | Tukar poin dengan kupon sesuai tier | ✓ | — | — |
| Pencairan Dana | Ajukan pencairan saldo ke rekening bank | — | ✓ | ✓ |
| Logout | Keluar dari sesi akun dengan aman | ✓ | ✓ | ✓ |

---

## 7. Alur Penggunaan Sistem (User Flow)

### 7.1. Alur Konsumen — Setor Sampah Langsung

```
1. Login ke sistem
2. Pilih menu "Setor Sampah"
3. Input data: jenis sampah, berat, informasi tambahan
4. Submit form → sistem hitung otomatis poin berdasarkan harga aktif
5. Poin ditambahkan ke akun konsumen
6. Konsumen dapat lihat histori & tukar poin dengan kupon
```

### 7.2. Alur Warmiendo — Setor Via Ekspedisi

```
1. Login ke sistem
2. Pilih menu "Setor Sampah" → pilih metode "Via Ekspedisi"
3. Input data: jenis sampah, berat, vendor ekspedisi, nomor resi
4. Admin memverifikasi setoran saat barang diterima
5. Saldo ditambahkan ke akun Warmiendo setelah verifikasi
6. Warmiendo mengajukan pencairan dana jika ingin mencairkan saldo
```

### 7.3. Alur Bank Sampah — Setor dari TPS

```
1. Petugas Bank Sampah login ke sistem
2. Input laporan setoran: jenis dan berat sampah hasil pilahan dari TPS
3. Admin memverifikasi laporan setoran
4. Reward uang tunai dikonfirmasi dan dicatat di sistem
5. Bank Sampah mengajukan pencairan dana
6. Admin menyetujui dan memproses pencairan
```

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Keamanan** | Autentikasi berbasis JWT. Password di-hash dengan bcrypt. RBAC ketat diterapkan di semua endpoint. |
| **Responsivitas** | Antarmuka responsif (mobile-friendly) — dapat diakses dari smartphone maupun desktop. |
| **Performa** | Halaman utama dan dashboard dimuat dalam < 3 detik pada koneksi standar. |
| **Ketersediaan** | Uptime minimal 99% pada jam operasional (07.00–17.00 WIB). |
| **Validasi Data** | Semua form memiliki validasi input di sisi client dan server. |
| **Ekspor Laporan** | Laporan dapat diekspor dalam format PDF dan Excel/CSV. |
| **Audit Log** | Setiap aksi penting dicatat (siapa, apa, kapan) untuk keperluan audit. |
| **Bahasa** | Antarmuka dalam Bahasa Indonesia. |

---

## 9. Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js + ShadcnUI + Tailwind CSS |
| **Backend / ORM** | Drizzle ORM |
| **Database** | Neon Database (PostgreSQL serverless) |
| **Autentikasi** | JWT (JSON Web Token) + bcrypt |
| **File Storage** | Cloudflare R2 (untuk bukti foto setoran ekspedisi) |
| **Ekspor Laporan** | PDFKit / ExcelJS (berjalan di Next.js API Routes) |
| **Deployment** | Vercel |

---

## 10. Glosarium

| Istilah | Definisi |
|---|---|
| **SICUAN** | Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai — nama sistem ini. |
| **RBAC** | Role-Based Access Control — sistem hak akses berbasis peran pengguna. |
| **Warmiendo** | Mitra eksternal Indofood (pembeli produk) yang dapat menyetorkan sampah kemasan kembali. |
| **Bank Sampah** | Mitra pengelola sampah eksternal yang melakukan pemilahan dan pendataan di TPS. |
| **TPS** | Tempat Penampungan Sementara — lokasi pengumpulan sampah sebelum disetorkan. |
| **Poin** | Satuan reward untuk Konsumen, bisa ditukar dengan kupon. |
| **Kupon Tier** | Level kupon berdasarkan akumulasi poin yang dikumpulkan konsumen. |
| **Pencairan Dana** | Proses konversi saldo/reward menjadi uang tunai yang ditransfer ke rekening. |
| **Raw Material** | Bahan baku hasil olahan dari sampah yang dikumpulkan. |
| **Saldo** | Nilai uang yang terakumulasi pada akun Warmiendo dari setoran sampah. |

---

*Akhir Dokumen PRD SICUAN v1.0 — PT. Indofood CBP Sukses Makmur Tbk*