WEBSITE GRIYA MADU — VERSI MULTI-FILE
====================================

Halaman:
- index.html: beranda, katalog, varian madu, pencarian, dan filter kategori
- detail.html: informasi produk
- orderan.html: keranjang dan checkout WhatsApp
- user.html: menu User, permintaan varian/kemasan khusus dan bingkisan acara, balasan Admin, serta riwayat/status pesanan
- profile.html: halaman profil bersama untuk User dan Admin; Profil Admin tetap di Profil; pesanan masuk dibuka dari menu Cart
- login.html: masuk dengan username atau email
- register.html: pendaftaran akun User
- forgot-password.html: penggantian kata sandi lokal berdasarkan email akun
- dashboard.html dan produk.html: area pengelola prototype


Cara membuka:
1. Jalankan start-local.bat.
2. Jendela server akan terbuka dan browser menuju http://127.0.0.1:8765.
3. Biarkan jendela server terbuka selama aplikasi digunakan. Cara ini membuat keranjang dan profil bisa berbagi penyimpanan pada browser yang sama.
4. Gunakan alamat `http://127.0.0.1:8765` yang dibuka oleh server. Jangan membuka HTML langsung dengan alamat `file:///...` karena penyimpanan browser dapat terpisah per halaman dan chat antarhalaman tidak akan terbaca. Jika chat sebelumnya dikirim lewat file://, kirim ulang setelah membuka aplikasi lewat server.

Akun demo:
- Admin: admin / admin123 (email reset demo: admin@griyamadu.local)
- User: user / user123 (email reset demo: user@griyamadu.local)
Akun baru yang didaftarkan otomatis memiliki role User.

Alur User utama: login, register, lupa kata sandi, katalog/cari/filter, detail produk, keranjang, checkout, profil, chat teks dua arah dengan Admin, permintaan varian/kemasan khusus atau bingkisan acara, dan riwayat pesanan. Riwayat pesanan User dan daftar pesanan Admin dapat difilter menurut rentang tanggal, jenis/kemasan atau varian madu, serta batas harga minimum dan maksimum. Chat mengambang muncul di halaman toko User; pesan teks dan balasan ditampilkan sebagai percakapan dan tersimpan di browser. Admin membalas melalui Profil Admin > Cart > Chat Pelanggan. Tombol Ajukan pesanan khusus membuka formulir permintaan produk terstruktur. User dapat mencantumkan ukuran khusus, jumlah banyak, foto contoh kemasan, acara dan tanggal kebutuhan, melihat status serta balasan Admin, dan membatalkan permintaan yang belum dijawab. Profil dapat diedit oleh Admin maupun User, termasuk unggah, crop/geser/zoom, dan hapus foto profil. Foto diperkecil dan disimpan di localStorage browser. Stok ditahan saat checkout dan dikembalikan jika pesanan dibatalkan sebelum dikirim. Admin mengelola alur status Menunggu konfirmasi → Dikonfirmasi → Diproses → Dikirim → Selesai, dapat mengisi nomor resi, dan dapat membatalkan sebelum pesanan dikirim. User melihat riwayat status pesanan. Keranjang, profil, pesanan, dan chat tersinkron antar-tab pada browser yang sama selama dibuka melalui start-local.bat. Data tetap lokal dan tidak tersinkron antar perangkat.

Skenario uji, batas input EP/BVA, dan langkah menjalankan tes otomatis tersedia di Skenario_Uji_User.md. Jalankan `npm test` dari folder ini dengan Node.js. Tes menggunakan modul bawaan Node dan tidak membutuhkan paket tambahan.

Catatan: aplikasi ini masih prototype lokal. Akun dan kata sandi disimpan di browser, tidak ada verifikasi atau email reset sungguhan, dan halaman pengelola belum dilindungi oleh autentikasi server. Jangan gunakan untuk akun penting atau penggunaan online. Untuk autentikasi aman dan sinkronisasi antar perangkat diperlukan backend/penyedia identitas.

Checkout WhatsApp diarahkan ke 0821-3907-1048.






