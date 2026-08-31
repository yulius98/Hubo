# PLANNING FASE 6 — Pekerjaan Lanjutan Hubo

> Dokumen ini adalah rencana kerja **lengkap** untuk item-item yang tersisa dari
> `upgrade_fiture.md` setelah **Fase 5 (Pematangan) benar-benar selesai**.
> Berisi: tujuan, kondisi saat ini, tahapan kerja per item, file terkait,
> kriteria selesai, dan test (Pest) yang harus dibuat.
>
> Aturan tetap berlaku:
> - Setiap fitur **wajib** disertai test Pest (lihat `tests/`).
> - Validasi memakai **Form Request** (bukan inline).
> - Routing Laravel → **Wayfinder** di frontend (`@/routes`), jangan `route()`/Ziggy.
> - Tidak ada hardcode: nilai apa pun yang bisa berubah harus masuk `config/` + `.env`.
> - PHP dirapikan dengan `vendor/bin/pint --dirty`.
> - Frontend diverifikasi dengan `npm run types`, `npm run lint`, `npm run build`.

## Bagian 0 — Prasyarat Infrastruktur (SUDAH SELESAI di Fase 5)

Seluruh parameter infrastruktur sudah **dinamis** (bisa diubah lewat env/config,
tanpa menyentuh kode). Parameter ini dibutuhkan oleh fase-fase di bawah.

| Parameter | Kunci .env | Default | Dipakai di |
|---|---|---|---|
| URL API RajaOngkir | `RAJAONGKIR_BASE_URL` | `https://api.rajaongkir.com/starter` | `ShippingService` |
| URL API Xendit | `XENDIT_BASE_URL` | `https://api.xendit.co` | `PaymentGatewayProcessor` |
| URL Midtrans sandbox | `MIDTRANS_SANDBOX_BASE_URL` | `https://app.sandbox.midtrans.com/api/v2` | `PaymentGatewayProcessor` |
| URL Midtrans production | `MIDTRANS_PRODUCTION_BASE_URL` | `https://app.midtrans.com/api/v2` | `PaymentGatewayProcessor` |
| Berat satuan produk (gram) | `SHIPPING_UNIT_WEIGHT_GRAM` | `500` | `config/shipping.php` → checkout FE+BE |
| Kota tujuan default | `SHIPPING_DEFAULT_CITY_ID` | `152` | `config/shipping.php` → checkout FE+BE |
| Retensi backup | `BACKUP_RETENTION_DAYS` | `7` | `config/backup.php` |
| Binary backup sqlite | `SQLITE_BACKUP_BIN` | — | `config/backup.php` |
| Broadcasting | `BROADCAST_CONNECTION` + `PUSHER_APP_*` | `log` | Dibutuhkan Fase 6.3 (E2) |
| Queue connection | `QUEUE_CONNECTION` | `database` | Dibutuhkan Fase 6.3 (E4) |

Catatan: kredensial payment gateway & ongkir (secret key dll.) **tetap** tersimpan
di DB dan dikelola dari panel admin (`PaymentGatewayConfig`, `ShippingConfig`) —
hanya alamat endpoint yang dioverride lewat env.

Konfigurasi yang sudah berjalan (context):
- `routes/console.php`: `subscriptions:process-billing` (daily) & `app:backup-database` (03:00).
- Kubernetes/deploy: sesuaikan `QUEUE_CONNECTION` & `BROADCAST_CONNECTION` saat Fase 6.3.

---

## Fase 6.1 — Billing & Gateway Langganan (A6) 🔴 Tinggi

### Kondisi sekarang
- `SubscriptionBillingService` lengkap: trial (`trial_ends_at`, `STATUS_TRIAL`),
  `advancePeriod()`, `createInvoice()`, `current_period_start/end`, table `subscription_invoices`.
- Halaman `billing` (user) + `billing/process` (admin) sudah ada.
- Scheduler `subscriptions:process-billing` sudah terpasang daily.

### Yang kurang
- Pembayaran invoice SaaS lewat gateway eksternal (Midtrans/Xendit) yang benar-benar menghasilkan `payment_url` untuk invoice langganan.
- Webhook eksternal (berasal dari gateway) untuk meng-mark invoice langganan sebagai lunas → perpanjang periode.
- Notifikasi email jatuh tempo & invoice belum dibayar.

### Tahapan kerja
- [ ] 1. `SubscriptionInvoice` pindah dari status `pending` ke alur pembayaran: buat `Payment` (reuse table `payments`) berbasis invoice, arahkan user ke `payment_url` gateway yang aktif (reuse `PaymentGatewayProcessor` / `PaymentGatewayService::defaultWebhookUrl`).
- [ ] 2. Tambah **webhook endpoint billing** di `routes/web.php` (`billing.webhook.xendit`, `billing.webhook.midtrans`) yang memverifikasi signature (pola `WebhookController` yang sudah ada, fail-closed) lalu memanggil `SubscriptionBillingService::markInvoicePaid($payment)`.
- [ ] 3. `markInvoicePaid()`: set invoice `paid`, muatasi `current_period_start/end` maju 1 periode, update status langganan ke `active`, kirim `Mail` (invoice paid + receipt PDF bila sudah ada pola invoice).
- [ ] 4. Job/komando «billing reminder»: cek invoice jatuh tempo dalam 3 hari & belum lunas → email pengingat; invoice melewati due date → status `overdue` → nonaktifkan fitur tenant (paksa turun plan).
- [ ] 5. Enforce di akses fitur: saat tenant `overdue`/melewati masa tenggang, blokir alur transaksi inti (order baru) dengan halaman/notice ramah (pola Inertia error page yang sudah ada).
- [ ] 6. Test: pendaftaran + trial berakhir, `advancePeriod` creates invoice, webhook valid menandai paid + maju periode, webhook signature invalid → 401, reminder email terkirim, blokir fitur saat overdue.

### File terkait
`app/Services/SubscriptionBillingService.php`, `app/Models/SubscriptionInvoice.php`, `app/Models/Payment.php`, `app/Http/Controllers/BillingController.php`, `app/Http/Controllers/WebhookController.php`, `routes/web.php`, `routes/console.php`, `config/services.php`.

### Kriteria selesai
- Invoice bisa dibayar via gateway nyata (atau mode test) dan webhook menandai `paid` secara otomatis.
- Periode langganan maju dengan benar; tenant yang telat bayar dibatasi aksesnya.
- Test baru ≥ 6 lulus; seluruh suite tetap hijau.

---

## Fase 6.2 — Lifecycle Tenant (A7, A8, G10) 🟡 Sedang

### A7 — Onboarding wizard pendaftaran tenant
**Kondisi:** belum ada alur first-run. **Tujuan:** panduan langkah demi langkah saat pertama kali tenant dibuat.

- [ ] 1. Deteksi keadaan "belum setup": user super-admin + tenant tanpa outlet/without data → redirect ke halaman `onboarding`.
- [ ] 2. Wizard 4 langkah (state kemajuan disimpan di session/DB):
      (a) profil bisnis (nama, slug, logo, alamat);
      (b) pilih paket (dari `plans`) + konfirmasi trial;
      (c) buat outlet pertama;
      (d) konfigurasi singkat (pajak, ongkir, gateway default) → tombol "Mulai".
- [ ] 3. Anti-kabur: setiap langkah boleh dilewati dari dashboard (tombol "Lewati"), wizard tidak memblokir akses permanen.
- [ ] 4. Test: redirect saat belum setup, penyelesaian wizard membuat outlet+tenant+langganan trial, tombol lewati.

**File:** `resources/js/pages/onboarding/*.tsx`, `app/Http/Controllers/OnboardingController.php`, `routes/web.php`, `HandleInertiaRequests`.

### A8 — Pengaturan per tenant/outlet
**Kondisi:** `Company`/`TenantService` dan `Outlet` sudah ada. **Tujuan:** halaman settings yang menyimpan parameter usaha.

- [ ] 1. Buat table/kolom settings (migrasi): `company_settings` (KV) + kolom outlet untuk `slug`, `logo/banner`, `jam_buka`, `mata uang`, `konfigurasi_pajak`, `alamat_pengiriman_default`.
- [ ] 2. Halaman `Pengaturan` (tenant + outlet terpisah) menggunakan Form Request; simpan & tampil ulang nilai.
- [ ] 3. Terapkan nilai di storefront: slug/logo/banner outlet dipakai `StorefrontController`, alamat default dipakai checkout, pajak dipakai perhitungan `tax`.
- [ ] 4. Test: CRUD settings per tenant/outlet, nilai berpengaruh ke storefront & checkout, permission owner only.

### G10 — Seeder production yang idempotent
**Kondisi:** cuma 1 user + role. **Tujuan:** seeder lengkap tapi aman dijalankan berulang.

- [ ] 1. `DatabaseSeeder` dipecah: `TenantSeeder`, `PlanSeeder`, `DemoCatalogSeeder`, `AdminSeeder` — semua `updateOrCreate`/`firstOrCreate` (idempotent).
- [ ] 2. `PlanSeeder`: beberapa paket dengan `feature_keys`, kuota, harga.
- [ ] 3. `DemoCatalogSeeder`: untuk tenant demo — kategori, produk + varian/SKU, outlet, stok (cukup, tanpa overload).
- [ ] 4. `AdminSeeder`: super admin dari env (`SEED_ADMIN_EMAIL` dll., wajib opsional & tidak hardcode).
- [ ] 5. Test: `php artisan db:seed` dua kali berturut → tidak error & tidak menggandakan data; test memakai refresh + seeder.

**File:** `database/seeders/*.php`, `database/factories/*`, `config/` (tambah env seed admin), `.env.example`.

### Kriteria selesai (Fase 6.2)
- Onboarding, settings per tenant/outlet, dan seeder idempotent berfungsi; test per item lulus; tidak ada data terduplikasi saat seed ulang.

---

## Fase 6.3 — Real-time & Antrian (E2, E4) 🟡 Sedang

### E2 — Broadcasting real-time (Pusher/Echo)
**Kondisi:** notifikasi in-app (DB channel) + polling `router.reload` sudah ada. Broadcasting belum.

- [ ] 1. Pasang `pusher/pusher-php-server` & `laravel-echo`/`pusher-js` (frontend); aktifkan `BROADCAST_CONNECTION=pusher` + `PUSHER_APP_*` di env.
- [ ] 2. Channel privat per tenant/outlet (`private-tenant.{id}`); kirim event `OrderCreated`, `LowStockAlert`, `StaffRequestUpdated` (reuse notifikasi yang ada, tambah `ShouldBroadcast`).
- [ ] 3. Frontend: init Echo di titik tengah app (guard jika `pusher` tidak dikonfigurasi → fallback polling lama), listen channel, update badge notifikasi tanpa reload.
- [ ] 4. Fallback aman: jika `BROADCAST_CONNECTION=log` / key kosong, perilaku platform tidak berubah (tetap polling).
- [ ] 5. Test: event broadcast dengan payload benar, notifikasi tersimpan DB tetap jalan (regression), mode tanpa pusher tidak error.

**File:** `app/Events/*.php`, `app/Notifications/*` (+ `ShouldBroadcast`), `resources/js/echo.ts`/`app.tsx`, `resources/js/lib/notifications.tsx`, `config/broadcasting.php`, `.env.example`.

### E4 — Queue/jobs untuk proses berat
**Kondisi:** table `jobs` ada; semua email & proses berjalan sinkron (`QUEUE=sync`).

- [ ] 1. Tentukan kandidat job: pengiriman email (`OrderPaidMail`, `InvoiceMail`, dsb.), ekspor laporan (B10), dan backup.
- [ ] 2. Buat job (`php artisan make:job`) untuk tiap kandidat; method yang memakai `Mail::send`/ekspor diubah memanggil `dispatch(new ...)->onQueue('default')`.
- [ ] 3. Executor: kirim fail ke `failed_jobs`; job dikonfigurasi `tries`/`backoff`/`timeout` wajar.
- [ ] 4. Kaitkan ke Fase 6.2 G10: seeder produk massal diproses lewat job saat jumlah besar.
- [ ] 5. Test: job diproses (queue `sync` di test), job gagal tercatat di `failed_jobs`, email tetap terkirim (Mail::fake).

**File:** `app/Jobs/*.php`, `config/queue.php` (sudah env), `routes/console.php`, controller/servis yang memanggil.

### Kriteria selesai (Fase 6.3)
- Event broadcast muncul real-time saat `PUSHER_*` terisi dan tidak merusak mode `log`; proses berat (email/ekspor/backup) berjalan di queue worker tanpa blokir request; test lulus.

---

## Fase 6.4 — Pengalaman Belanja (D3, D4, D6) 🟡/🟢

### D3 — Alamat & buku alamat pengguna
**Kondisi:** checkout hanya menerima `shipping_address` bebas. **Tujuan:** simpan beberapa alamat.

- [ ] 1. Migrasi `addresses` (user_id, label, nama penerima, no HP, provinsi/kota (RajaOngkir IDs), alamat lengkap, default flag). Soft deletes opsional.
- [ ] 2. CRUD page `Alamat Saya` (pola page akun yang sudah ada) + Form Request; tandai aktif sebagai default.
- [ ] 3. Checkout: dropdown pilih alamat → isi `shipping_address` + `shipping_destination_city_id` dari alamat terpilih.
- [ ] 4. Test: CRUD, default flag, checkout memakai alamat tersimpan (ongkir pakai kota alamat itu).

**File:** `database/migrations/*_create_addresses_table.php`, `app/Models/Address.php`, `app/Http/Controllers/AddressController.php`, `resources/js/pages/akun/*.tsx`, `resources/js/pages/checkout.tsx`, `routes/web.php`.

### D4 — Wishlist / simpan produk
**Kondisi:** belum ada. **Tujuan:** pembeli bisa menandai produk.

- [ ] 1. Tabel pivot `product_user` (`wishlist`) + kolom pagination ikon hati di halaman produk & katalog.
- [ ] 2. Route toggle (`POST`), halaman `Wishlist Saya`, badge count di header.
- [ ] 3. Test: tambah/hapus wishlist, hanya untuk login, count benar.

**File:** migrasi pivot, `app/Models/Produk.php` (many-to-many), `WishlistController.php`, page `wishlist.tsx`, komponen header.

### D6 — Track order untuk pembeli
**Kondisi:** `orders.show` sudah menampilkan status. **Tujuan:** tampilan status pengiriman & timeline.

- [ ] 1. Tambah detail pengiriman di `orders.show`: nomor resi, kurir, perkiraan (data tersimpan dari checkout/onkir).
- [ ] 2. Timeline status (dari `order_status_histories` bila ada, atau turunan status) — `dipesan → dibayar → diproses → dikirim → selesai → (jika ada) kembali`.
- [ ] 3. (Opsional, jika berizin) integrasi lacak kurir bila gateway menawarkan API.
- [ ] 4. Test: timeline urut & status benar untuk tiap transisi.

**File:** `app/Http/Controllers/OrderController.php`, `resources/js/pages/order/*.tsx`, model status history.

### Kriteria selesai (Fase 6.4)
- Buku alamat terpakai penuh di checkout; wishlist fungsional; pembeli melihat track order yang akurat; test per item lulus.

---

## Fase 6.5 — Pelaporan Lanjutan (F3, F4) 🟢

### F3 — Laporan pajak (PPN / faktur pajak)
**Kondisi:** laporan keuangan (F1/F2) sudah ada; pajak dihitung saat order. Belum ada rekap PPN.

- [ ] 1. Rekap PPN bulanan: aggregate `tax` dari `orders` (status tidak refund/expired) per bulan → halaman/tabel `Laporan PPN`.
- [ ] 2. Filter periode + ekspor CSV (pola B10).
- [ ] 3. Test: rekap PPN per bulan benar, order refund/batal tidak dihitung.

### F4 — Forecasting / analisis musiman
- [ ] 1. Data historis (penjualan per hari/bulan, produk terlaris) dari table yang ada.
- [ ] 2. Dashboard: perbandingan antar-periode (MoM / YoY) + tren sederhana (moving average di sisi server/config).
- [ ] 3. Test: perhitungan tren/perbandingan diuji dengan dataset tetap.

### Kriteria selesai (Fase 6.5)
- Laporan PPN akurat + bisa diekspor; dashboard menampilkan perbandingan/tren yang teruji.

---

## Fase 6.6 — Platform, Privasi & Keamanan (G3, A11, G6) 🟢

### G3 — Public REST API untuk integrasi
**Kondisi:** belum ada. **Tujuan:** API untuk integrasi eksternal (toko eksternal, aplikasi POS).

- [ ] 1. Pakai `API Resource` + versioning `routes/api.php` (v1): resource Produk, Stok, Order (read/update ringan).
- [ ] 2. Autentikasi token (Laravel Sanctum sudah tersedia? verifikasi; `PersonalAccessToken`), rate limiting per token, scopes minimal.
- [ ] 3. Dokumentasi ringkas (di file API README atau komentar route) + contoh curl.
- [ ] 4. Test: akses tanpa token 401, token valid dapat data dengan pagination, rate limit bekerja.

### A11 — Data export / GDPR-style (per tenant)
- [ ] 1. Perintah/UI "Ekspor semua data": kompres data tenant (profil, orders, payments, invoices, staff, outlet, catalog) jadi JSON/ZIP, dikirim via job (Fase 6.3 E4) lalu email.
- [ ] 2. "Hapus semua data": hapus tenant + seluruh relasi (kaskade terkontrol) dengan konfirmasi berlapis (typing konfirmasi).
- [ ] 3. Test: ekspor berisi seluruh entity, penghapusan menghapus relasi & tidak menyentuh data tenant lain.

### G6 — 2FA / keamanan lanjutan
**Kondisi:** WorkOS menangani SSO; belum ada 2FA enforcement.

- [ ] 1. Opsional 2FA (TOTP) untuk role pemilik/admin via WorkOS (pastikan alurnya didukung) atau paket TOTP internal.
- [ ] 2. Enforce: tenant pengaturan menyebutkan "2FA wajib untuk owner"; pembatasan sesi perangkat optional.
- [ ] 3. Test: alur registrasi/verifikasi TOTP, restore code, owner tanpa 2FA diblokir saat kebijakan aktif.

### Kriteria selesai (Fase 6.6)
- API dapat diakses dengan token & rate limit; ekspor/hapus data tenant berjalan aman (via queue); 2FA enforce-able untuk role sensitif.

---

## Definisi Selesai (Definition of Done) — Global

Untuk **setiap** item di atas:
- [ ] Kode mengikuti konvensi project (Form Request, Wayfinder, Eloquent, no hardcode).
- [ ] Test Pest ditulis & lulus untuk skenario kunci (positif, negatif, permission).
- [ ] `vendor/bin/pint --dirty` bersih.
- [ ] `npm run types`, `npm run lint`, `npm run build` hijau bila ada perubahan frontend.
- [ ] `php artisan test --compact` seluruh suite hijau (jangan ada test rusak).
- [ ] Parameter baru terdokumentasi di `.env.example` (bila ada).

## Prosedur Verifikasi Akhir (per fase)
```
php artisan test --compact
vendor/bin/pint --dirty --format agent
npm run types && npm run lint && npm run build
```

## Catatan
- Prioritaskan **Fase 6.1** (A6) sebelum 6.2–6.6 karena terkait pendapatan SaaS.
- **Fase 6.3 (E2)** butuh akun Pusher/aplikasi broadcasting; tanpa itu fitur berjalan di modus fallback (tidak memblokir).
- **Fase 6.3 (E4)** wajib sebelum A11 (ekspor besar-besaran) & G10 (seed massal) untuk mencegah request timeout.
- Semua keputusan nilai default dapat diubah lewat `.env` tanpa mengubah kode.