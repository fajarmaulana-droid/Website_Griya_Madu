# Skenario Uji Menu User

## Alur fitur (10 fitur keseluruhan)

| ID | Fitur | Skenario uji / hasil yang diharapkan |
|---|---|---|
| U-01 | Login | Masukkan username/email dan kata sandi valid; User masuk ke Akun Saya. Kredensial salah menampilkan pesan gagal. |
| U-02 | Register | Daftarkan akun dengan username/email baru dan kata sandi cocok; akun tersimpan sebagai role User. Username/email duplikat ditolak. |
| U-03 | Forgot password | Masukkan email yang terdaftar dan kata sandi baru yang sama pada dua kolom; kata sandi akun lokal berubah. Email tidak terdaftar ditolak. |
| U-04 | Katalog, cari, dan filter | Cari nama produk dan pilih kategori; daftar hanya menampilkan produk yang cocok. Kata kunci kosong menampilkan semua produk pada kategori. |
| U-05 | Detail produk | Buka detail produk dari katalog; nama, kategori, harga, foto, dan stok sesuai data produk tersimpan. |
| U-06 | Keranjang | Tambah produk, ubah jumlah, dan hapus item; total mengikuti jumlah. Jumlah tidak boleh kurang dari 1 atau melebihi stok. |
| U-07 | Checkout | Login sebagai User, isi nama, nomor HP 10–15 digit, alamat/tautan Gmaps, lalu kirim; ringkasan dibuka di WhatsApp, pesanan lokal dibuat berstatus Menunggu konfirmasi, stok ditahan sesuai kuantitas, dan jumlah keranjang kembali 0. Jika stok tidak cukup, pesanan tidak dibuat. |
| U-08 | Profil dan riwayat/status pesanan | User dan Admin membuka Profil, mengunggah foto, menggeser dan mengatur zoom crop, mengubah data, dan menyimpan; foto tampil kembali setelah halaman dibuka ulang dan role tetap sesuai. Menghapus foto lalu menyimpan menampilkan avatar default. User membatalkan pesanan yang masih Menunggu konfirmasi; status berubah menjadi Dibatalkan oleh pelanggan dan stok yang ditahan kembali. Riwayat User dan Admin dapat difilter dengan rentang tanggal, jenis/kemasan madu, serta harga minimum dan maksimum. |
| U-09 | Permintaan produk dan bingkisan | User mengajukan varian yang belum tersedia, ukuran/bentuk kemasan khusus, atau pesanan banyak untuk acara; mengisi jumlah dan nomor HP; permintaan tersimpan dengan status Menunggu respon. Admin membalas serta memperbarui status dan User melihat balasan tersebut. |
| U-10 | Chat teks dua arah | User mengirim teks melalui Chat pada halaman toko. Admin melihat percakapan per User di Profil Admin > Cart > Chat Pelanggan dan membalas. Pesan Admin tampil pada chat User dan tetap ada setelah berpindah halaman atau memuat ulang. |

| A-01 | Status pesanan dan stok Admin | Login Admin, konfirmasi pesanan Menunggu konfirmasi. Stok tidak dikurangi ulang karena telah ditahan saat checkout. Lanjutkan status secara berurutan: Dikonfirmasi → Diproses → Dikirim → Selesai; nomor resi dapat diisi saat menandai Dikirim. Admin dapat membatalkan sebelum pesanan dikirim; status dan riwayat tampil pada menu User, dan stok yang ditahan dikembalikan. Konfirmasi berulang tidak mengurangi stok dua kali. |
| A-02 | Balas permintaan produk dan bingkisan | Login Admin, buka Cart di Profil Admin, tinjau jenis permintaan, ukuran khusus, jumlah, acara, serta tanggal kebutuhan. Pilih status dan kirim balasan; status dan tanggapan muncul pada akun User yang mengirim permintaan. |
| A-03 | Balas chat teks User | Login Admin, buka Cart di Profil Admin, tulis balasan pada percakapan User, lalu kirim. Pastikan balasan muncul di chat User. |

## Batas input (EP/BVA)

- Username: valid 3–20 karakter huruf kecil/angka/garis bawah; 2 karakter atau format lain ditolak.
- Kata sandi: valid minimal 6 karakter; 5 karakter ditolak.
- Email: bentuk email valid diterima; kosong/tidak valid ditolak oleh form.
- Nomor HP checkout: 10 dan 15 digit diterima; 9 atau 16 digit ditolak.
- Kuantitas: batas bawah 1 dan batas atas stok diterima; 0 dan stok + 1 tidak diterima.
- Pesanan: User hanya dapat membatalkan saat Menunggu konfirmasi; Admin dapat membatalkan sebelum status Dikirim. Perubahan status maju sesuai alur yang tersedia.

## Uji otomatis

Jalankan `npm test` dari folder Website_Griya_Madu. Tes memakai Node.js bawaan dan tidak memerlukan paket tambahan.






