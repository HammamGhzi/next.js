# FORTI Study Club

Website FORTI berbasis Next.js, TypeScript, Supabase, dan Three.js. Logo serta model laptop 3D ada di `public/images` dan `public/models`.

## Menjalankan aplikasi

1. Jalankan `npm install` lalu `npm run dev`.
2. Buat proyek Supabase dan salin URL serta anon key ke `.env.local` mengikuti `.env.example`.
3. Jalankan `supabase/schema.sql` di Supabase SQL Editor. Skrip ini membuat tabel, RLS, bucket gambar, trigger profil, dan fungsi undangan anggota tim.
4. Daftarkan akun pertama lewat halaman `/login`. Jadikan akun pengelola sebagai admin dengan SQL berikut, ganti alamat emailnya:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'email-admin-kamu';
   ```

5. Jika memakai Google OAuth, aktifkan provider Google di Supabase Authentication dan daftarkan alamat callback Supabase pada konfigurasi OAuth Google.

## Fitur

- Halaman publik profil, pengurus aktif dan arsip periode, galeri final project, serta katalog PKM.
- Login email/kata sandi dan Google OAuth.
- Dashboard anggota untuk membentuk tim, mengundang anggota terdaftar, mengirim final project dengan pratinjau langsung, dan mengarsipkan proposal final lewat Google Drive.
- Cover final project dipotong ke rasio 16:9 dan dikompres di browser. Foto pengurus dikompres sebelum unggah.
- Panel admin untuk membuat dan mengaktifkan periode, menambahkan pengurus, mengkurasi final project, dan memverifikasi PKM.
- Row Level Security membatasi data anggota dan aksi admin. Admin pertama perlu dipromosikan secara manual memakai SQL di atas.

Tanpa `.env.local`, halaman publik tetap terbuka, sementara fitur yang memerlukan akun atau database menampilkan petunjuk konfigurasi. Konten proyek contoh pada beranda hanya mockup dan perlu diganti dengan karya serta informasi resmi FORTI.
