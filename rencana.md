# Rencana Implementasi RBAC — Aplikasi Hubo

## Ringkasan Aturan RBAC Final

| Role | Akses |
|------|-------|
| **user** | Role dasar semua user, tidak punya akses apapun |
| **owner outlet** | Buka outlet (otentikasi user), akses semua outlet miliknya, kelola produk/kategori/staff/transaksi IN & OUT, terima request karyawan |
| **admin outlet** | Hanya akses outlet yang di-assign, kelola produk/kategori outlet tersebut, transaksi IN saja, tidak bisa jadi owner di outlet yang sama |
| **kasir** | 1 outlet saja, akses kasir (transaksi OUT), lihat data outlet sendiri, request karyawan, buka outlet baru (auto jadi owner) |

> **Status implementasi: SELESAI** — seluruh fase (1–7) sudah dijalankan dan lolos test (51 passed). Lihat log perubahan di `chat.md`.

---

## FASE 1: Database & Model Changes

### 1.1 — Hapus role `admin app` dari seeder
- `RoleSeeder.php`: Hapus `'admin app'` dari array
- Jika ada user yang sudah punya role ini, perlu migration untuk detach

### 1.2 — Tambah `id_outlet` ke tabel `kategoris`
- Buat migration baru: `add_outlet_id_to_kategoris_table`
- Tambah kolom `id_outlet` (foreign key ke `outlets`, nullable untuk backward compatibility)
- Update `Kategori` model: tambahkan relasi `outlet()` BelongsTo
- Update `KategoriController`: filter kategori berdasarkan outlet yang diakses user

### 1.3 — Buat custom Role Middleware
- Buat middleware `EnsureUserHasRole` yang bisa cek role global (`role_user`) dan per-outlet (`outlet_user`)
- Register di `bootstrap/app.php`

### 1.4 — Buat Policy untuk authorization
- `OutletPolicy`: Siapa yang bisa view/create/update/delete outlet
- `ProdukPolicy`: Siapa yang bisa CRUD produk per outlet
- `KategoriPolicy`: Siapa yang bisa CRUD kategori per outlet
- `RequestRolePolicy`: Siapa yang bisa approve/reject

---

## FASE 2: Route-Level Authorization

### 2.1 — Protect routes dengan middleware & policy

| Route | Akses | Middleware/Policy |
|-------|-------|-------------------|
| `myoutlet` (CRUD) | Owner outlet | `role:owner outlet` + `OutletPolicy` |
| `kelola_kategori` | Owner + Admin outlet | `role:owner outlet,admin outlet` + outlet scope |
| `produk/{outlet_id}` | Owner + Admin outlet + Kasir (read only) | `role:owner outlet,admin outlet,kasir` + outlet scope |
| `produk` (store/update/delete) | Owner + Admin outlet | `role:owner outlet,admin outlet` + outlet scope |
| `add_staff/{outlet_id}` | Owner outlet | `role:owner outlet` + ownership check |
| `terima_staff` / `tolak_staff` | Owner outlet | `role:owner outlet` + ownership check |
| `cashier` | Kasir + Owner outlet | `role: kasir,owner outlet` + outlet scope |
| `req_staff` | Semua user | `auth` saja |

### 2.2 — Hapus route yang tidak perlu atau pindah
- Route `kelola_kategori` yang sekarang global → scope per outlet

---

## FASE 3: Validasi Role Logic

### 3.1 — `RequestStaffController@store` — Perkuat validasi
- User yang sudah jadi **owner outlet** TIDAK BISA mengajukan jadi admin outlet atau kasir
- User yang sudah jadi **admin outlet** TIDAK BISA mengajukan jadi kasir
- User yang sudah jadi **kasir** TIDAK BISA mengajukan jadi admin outlet
- User yang sudah jadi **kasir** TIDAK BISA mengajukan kasir lagi di outlet lain

### 3.2 — `RequestRoleController@terima` — Fix bug + validasi
- Fix bug baris 43: `$user->role()->attach($data_staf->user_id, ...)` → `$user->role()->attach($data_staf->role_id, ...)`
- Tambah validasi: jika request role admin outlet, pastikan outlet dimiliki oleh owner yang sama
- Jika request diterima → detach role lama jika ada konflik

### 3.3 — `OutletController@store` — Validasi ownership
- Ketika buat outlet baru → attach role `owner outlet` ke user + role global `owner outlet`
- Cek: user yang sudah admin outlet di outlet lain tetap bisa buat outlet baru (auto jadi owner)

### 3.4 — Transisi Admin → Owner
- Admin outlet di Outlet A yang buat outlet baru → otomatis jadi owner outlet baru
- Role admin outlet di Outlet A TIDAK otomatis dihapus (harus di-manual oleh owner Outlet A)

---

## FASE 4: Fitur Baru — Detach/Revoke Role

### 4.1 — Route & Controller baru
- `POST /outlet/{outlet}/remove-staff` → Owner outlet bisa remove admin/kasir dari outlet-nya
- Route ini hanya bisa diakses oleh owner outlet yang bersangkutan

### 4.2 — Logic detach
- Cek user yang login adalah owner dari outlet tersebut
- Detach dari `outlet_user` pivot
- Jika user tidak punya role di outlet manapun lagi → detach role global juga
- Log atau notifikasi penghapusan

### 4.3 — Frontend
- Tambah tombol "Hapus Staff" di halaman kelola staff (hanya terlihat oleh owner)
- Konfirmasi dialog sebelumhapus

---

## FASE 5: Controller Logic Updates

### 5.1 — `CashierController@index`
- Tambah cek: user harus punya role kasir ATAU owner outlet
- Filter produk berdasarkan outlet yang dipilih
- Jika kasir → paksa pakai outlet mereka sendiri (ignore `selected_outlet_id`)

### 5.2 — `ProdukController`
- `index`: Filter produk berdasarkan outlet yang diakses user
- `store`: Hanya owner/admin outlet yang boleh tambah produk
- `update/delete`: Hanya owner/admin outlet, dan harus di outlet yang sama

### 5.3 — `KategoriController`
- Tambah filter berdasarkan `id_outlet`
- Hanya owner dan admin outlet yang bisa CRUD kategori outlet mereka

### 5.4 — `HandleInertiaRequests`
- Update role filtering: hapus logic untuk `admin app`
- Pastikan sidebar hanya menampilkan menu yang sesuai role

---

## FASE 6: Frontend Updates

### 6.1 — `app-sidebar.tsx`
- Hapus logic untuk `admin app`
- **Owner outlet**: Home, Profile, Dashboard, Kelola Kategori, Buka Outlet, Request Menjadi Karyawan, Buka Layanan Kasir, Kelola Produk
- **Admin outlet**: Home, Profile, Dashboard, Kelola Kategori, Kelola Produk (read-only outlet tertentu)
- **Kasir**: Home, Profile, Dashboard, Request Menjadi Karyawan, Buka Layanan Kasir
- **User biasa**: Home, Profile, Dashboard, Buka Outlet (buat outlet baru → auto jadi owner)

### 6.2 — Halaman `request_menjadi_staff.tsx`
- Sembunyikan form jika user sudah punya role yang tidak kompatibel
- Tampilkan warning yang benar berdasarkan aturan baru

### 6.3 — Halaman `tambah_staff.tsx`
- Hanya bisa diakses oleh owner outlet
- Tambah tombol "Hapus Staff" untuk setiap staff

### 6.4 — Dashboard
- Filter data transaksi berdasarkan role dan outlet yang diakses

---

## FASE 7: Testing

### 7.1 — Pest tests untuk RBAC
- Test setiap role bisa akses route yang benar
- Test setiap role TIDAK BISA akses route yang salah
- Test validasi silang role (owner tidak bisa jadi admin, dll)
- Test workflow request → approve → attach role
- Test detach/revoke role

---

## Urutan Eksekusi yang Disarankan

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7
(Database)  (Routes)  (Validasi) (Fitur Baru) (Logic)  (Frontend) (Tests)
```
