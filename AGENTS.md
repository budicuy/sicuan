<!-- BEGIN:nextjs-agent-rules -->
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Overview
Ini Adalah  Project Pengelolaan sampah berbasis web yang bertujuan untuk mempermudah pengelolaan sampah di yang di keluarkan oleh PT. Indofood yang mana sampah yang dihasilkan oleh PT. Indofood ini sangat banyak dan perlu di kelola dengan baik agar tidak menimbulkan dampak negatif bagi lingkungan sekitar.

# Tujuan Project
Tujuan dari project ini adalah untuk mempermudah pengelolaan sampah yang dihasilkan oleh PT. Indofood agar dapat di kelola dengan baik dan tidak menimbulkan dampak negatif bagi lingkungan sekitar. Selain itu, project ini juga bertujuan untuk meningkatkan kesadaran masyarakat tentang pentingnya pengelolaan sampah yang baik dan benar.

# Tech Stack
- React + Next.js
- Tailwind CSS
- Drizzle ORM + Neon Serverless Postgres
- Motion React
- Zod
- Bun

# Aturan Command
1. **diff**:  Gunakan untuk menunjukkan perbedaan antara dua teks atau kode. Formatnya harus seperti ini:
   ```
   diff
   - Teks atau kode yang dihapus
   + Teks atau kode yang ditambahkan
   ```

2. **tree**:  Gunakan untuk menampilkan struktur direktori atau file dalam format pohon. Formatnya harus seperti ini:
   ```
   tree 
   ```

3. **git**: Gunakan untuk menjalankan perintah Git. Formatnya harus seperti ini:
   ```
   git <perintah>
   ```

4. **bun**: Gunakan untuk menjalankan perintah bun. Formatnya harus seperti ini:
   ```
   bun  <perintah>
   ```

5. **ls**: Gunakan untuk menampilkan daftar file dan direktori dalam format list. Formatnya harus seperti ini:
   ```
   ls
   ```

### Command Git
- git status                 -> Compact status
- git log -n 10              -> One-line commits
- git diff                   -> Condensed diff
- git add                    -> "ok"
- git commit -m "msg"        -> "ok abc1234"
- git push                   -> "ok main"
- git pull                   -> "ok 3 files +10 -2"

### Files 
- ls .                       -> Token-optimized directory tree
- read file.rs               -> Smart file reading
- read file.rs -l aggressive -> Signatures only (strips bodies)
- find "*.rs" .              -> Compact find results
- grep "pattern" .           -> Grouped search results
- diff file1 file2           -> Condensed diff (exit 1 if files differ)

### lint / build                        
- bun lint lint              -> Biome linters
- bun run build              -> Build project
- bun run db:seed            -> Seed database using Drizzle ORM
- bun run db:push            -> Push database changes using Drizzle ORM

# Best  Practices
1. Gunakan Teknik Clean Code dalam penulisan kode agar kode lebih mudah dibaca dan dipahami.
2. Gunakan Teknik DRY (Don't Repeat Yourself) dalam penulisan kode agar kode lebih efisien dan mudah di maintain.
3. Gunakan Teknik YAGNI (You Aren't Gonna Need It) dalam penulisan kode agar kode lebih efisien dan tidak menambah kompleksitas yang tidak perlu.
4. Selalu jalanakn testing menggunak bun lint untuk memastikan kode yang ditulis tidak mengandung error atau bug ketika sudah selesai melekukan perubahan kode.
5. Jangan  jalankan bun run build dan juga commit kode ke github jika saya belum menyuruh untuk melakukannya, karena saya akan melakukan review terlebih dahulu sebelum kode di commit ke github.
6. ketika kamu membuat penjelasan tolong gunakan bahasa indonesia yang mudah dipahami dan jelas.
7. Selalu jalankan linting menggunakan bun lint setelah melakukan perubahan kode agar kode yang ditulis tidak mengandung error, warning, atau bug.










