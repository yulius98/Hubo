# Hubo - Multi-Outlet Management System

![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat&logo=laravel)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat&logo=tailwind-css)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat&logo=php)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat&logo=postgresql)

Hubo adalah aplikasi manajemen multi-outlet yang dikembangkan untuk mengelola outlet, produk, kategori, transaksi, dan staff secara terintegrasi dengan antarmuka yang modern dan responsif.

## 📋 Daftar Isi

- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Project](#struktur-project)
- [Testing](#testing)
- [Scripts NPM](#scripts-npm)
- [API Routes](#api-routes)
- [Lisensi](#lisensi)

## 🎯 Tentang Aplikasi

Hubo adalah sistem manajemen bisnis yang dirancang untuk membantu pemilik bisnis mengelola multiple outlet dengan mudah. Aplikasi ini menyediakan fitur lengkap untuk manajemen produk, inventori, transaksi, dan tim staff dengan antarmuka yang intuitif dan modern.

### Kegunaan Utama:
- **Manajemen Multi-Outlet**: Kelola beberapa outlet dari satu dashboard terpusat
- **Kontrol Inventori**: Pantau stok produk di setiap outlet secara real-time
- **Manajemen Transaksi**: Catat dan lacak semua transaksi penjualan
- **Manajemen Tim**: Kelola staff dan role access untuk setiap outlet
- **Analisis Bisnis**: Dashboard dengan visualisasi data untuk decision making

## ✨ Fitur Utama

### 1. Autentikasi & Otorisasi
- ✅ Login/Logout menggunakan WorkOS AuthKit
- ✅ Role-based access control (Admin, Owner Outlet, Staff, Kasir, User)
- ✅ Session validation dan security middleware
- ✅ Profile management dengan avatar

### 2. Manajemen Outlet
- ✅ CRUD Outlet (Create, Read, Update, Delete)
- ✅ Upload gambar outlet
- ✅ Informasi detail outlet (nama, alamat, kota, telepon)
- ✅ Soft delete untuk data safety
- ✅ Assignment staff ke outlet tertentu

### 3. Manajemen Produk
- ✅ CRUD Produk per outlet
- ✅ Upload gambar produk dengan Intervention Image
- ✅ Kategorisasi produk
- ✅ Manajemen stok dan harga
- ✅ Filter produk berdasarkan outlet

### 4. Manajemen Kategori
- ✅ CRUD Kategori produk
- ✅ Pengelompokan produk berdasarkan kategori
- ✅ Kategori dapat digunakan di multiple outlet

### 5. Sistem Transaksi
- ✅ Pencatatan transaksi penjualan
- ✅ Tracking transaksi per outlet
- ✅ Riwayat transaksi dengan detail lengkap
- ✅ Soft delete untuk audit trail

### 6. Keranjang Belanja
- ✅ Keranjang belanja untuk user
- ✅ Keranjang belanja untuk kasir
- ✅ Manajemen item dalam keranjang

### 7. Request Staff & Role Management
- ✅ Request untuk menjadi staff outlet
- ✅ Approval system untuk request role
- ✅ Assignment role ke user
- ✅ Multi-user per outlet support

### 8. Dashboard & Reporting
- ✅ Dashboard with overview statistics
- ✅ Homepage dengan informasi outlet
- ✅ Profile page untuk user management

### 9. Settings
- ✅ Profile settings (update profile, change avatar)
- ✅ Appearance settings (theme customization)
- ✅ Account management

## 🚀 Tech Stack

### Backend
| Technology | Version | Kegunaan |
|-----------|---------|----------|
| **PHP** | ^8.2 | Server-side programming language |
| **Laravel Framework** | ^12.0 | PHP MVC Framework |
| **Inertia Laravel** | ^2.0 | Server-side routing untuk SPA |
| **Intervention Image** | ^3.11 | Image processing & manipulation |
| **Laravel Tinker** | ^2.10.1 | REPL untuk debugging |
| **Laravel Wayfinder** | ^0.1.9 | Navigation & routing helper |
| **Laravel WorkOS** | ^0.6.0 | Authentication dengan WorkOS |

### Frontend
| Technology | Version | Kegunaan |
|-----------|---------|----------|
| **React** | ^19.2.0 | UI Library |
| **React DOM** | ^19.2.0 | React rendering |
| **TypeScript** | ^5.7.2 | Type-safe JavaScript |
| **Inertia React** | ^2.3.7 | Inertia.js adapter untuk React |
| **TailwindCSS** | ^4.0.0 | Utility-first CSS framework |
| **Vite** | ^7.0.4 | Build tool & dev server |

### UI Components & Libraries
| Library | Version | Kegunaan |
|---------|---------|----------|
| **@headlessui/react** | ^2.2.0 | Unstyled accessible UI components |
| **@heroicons/react** | ^2.2.0 | Icon library dari Tailwind |
| **Lucide React** | ^0.475.0 | Icon library |
| **Radix UI** | Multiple packages | Accessible component primitives |
| **Framer Motion** | ^12.34.2 | Animation library |
| **Class Variance Authority** | ^0.7.1 | Variant management untuk components |
| **clsx** | ^2.1.1 | Conditional className utility |
| **Tailwind Merge** | ^3.0.1 | Merge Tailwind classes |

### Development Tools
| Tool | Version | Kegunaan |
|------|---------|----------|
| **ESLint** | ^9.17.0 | Linting untuk JavaScript/TypeScript |
| **Prettier** | ^3.4.2 | Code formatting |
| **TypeScript ESLint** | ^8.23.0 | ESLint rules untuk TypeScript |
| **Pest PHP** | ^4.4 | Testing framework |
| **Laravel Pint** | ^1.24 | PHP code style fixer |
| **Laravel Boost** | 2.0 | Laravel performance tools |

### Database & Cache
- **PostgreSQL** - Relational database
- **Redis** (optional) - Caching & session storage

## 💻 Persyaratan Sistem

### Minimum Requirements:
- **PHP**: >= 8.2
- **Composer**: >= 2.0
- **Node.js**: >= 18.x
- **NPM/Yarn**: Latest version
- **PostgreSQL**: >= 13.0
- **Web Server**: Apache/Nginx

### Recommended:
- **PHP**: 8.3
- **Node.js**: 20.x LTS
- **PostgreSQL**: 15.0+
- **RAM**: 4GB minimum
- **Storage**: 1GB free space

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd Hubo
```

### 2. Install Dependencies

#### Install PHP Dependencies
```bash
composer install
```

#### Install Node.js Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy .env.example ke .env
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Setup
```bash
# Edit .env dan sesuaikan database credentials
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=hubo_db
DB_USERNAME=postgres
DB_PASSWORD=

# Run migrations
php artisan migrate

# (Optional) Run seeders untuk data dummy
php artisan db:seed
```

### 5. Storage Link
```bash
# Create symbolic link untuk storage
php artisan storage:link
```

### 6. WorkOS Configuration
```bash
# Tambahkan WorkOS credentials di .env
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
```

### 7. Build Assets
```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Start Development Server
```bash
# Start PHP development server
php artisan serve

# Akan berjalan di http://localhost:8000
```

## ⚙️ Konfigurasi

### WorkOS Setup
1. Daftar di [WorkOS](https://workos.com)
2. Buat project baru
3. Setup AuthKit
4. Copy API Key dan Client ID ke `.env`
5. Configure redirect URLs di WorkOS dashboard

### PostgreSQL Database Configuration

#### Membuat Database:
```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database baru
CREATE DATABASE hubo_db;

# Buat user khusus (optional)
CREATE USER hubo_user WITH PASSWORD 'your_password';

# Berikan privileges
GRANT ALL PRIVILEGES ON DATABASE hubo_db TO hubo_user;

# Keluar dari psql
\q
```

#### Konfigurasi .env:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=hubo_db
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

**Note**: Pastikan PostgreSQL service sudah berjalan sebelum menjalankan migrations.

### File Storage Configuration
Edit `config/filesystems.php` untuk konfigurasi storage:
```php
'disks' => [
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
    ],
],
```

### Image Processing
Intervention Image sudah dikonfigurasi untuk handle:
- Upload gambar outlet
- Upload gambar produk
- Upload avatar user
- Resize dan optimization otomatis

## 📖 Cara Penggunaan

### 1. Login
1. Akses aplikasi di browser: `http://localhost:8000`
2. Klik tombol "Login"
3. Authenticate menggunakan WorkOS
4. Redirect ke dashboard setelah berhasil login

### 2. Manajemen Outlet

#### Membuat Outlet Baru:
1. Navigate ke menu "My Outlet"
2. Klik tombol "Tambah Outlet"
3. Isi form:
   - Upload gambar outlet
   - Nama outlet
   - Alamat lengkap
   - Kota
   - Nomor telepon
4. Submit form
5. Outlet baru akan muncul di list

#### Edit/Hapus Outlet:
- Klik icon edit untuk mengubah data outlet
- Klik icon delete untuk menghapus outlet (soft delete)

### 3. Manajemen Produk

#### Menambah Produk:
1. Pilih outlet dari daftar
2. Navigate ke halaman produk outlet
3. Klik "Tambah Produk"
4. Isi form produk:
   - Upload gambar produk
   - Nama produk
   - Pilih kategori
   - Harga
   - Stok
   - Deskripsi
5. Submit form

#### Edit/Hapus Produk:
- Edit produk dengan klik icon edit
- Hapus produk dengan klik icon delete
- Filter produk berdasarkan kategori

### 4. Manajemen Kategori

#### Membuat Kategori:
1. Navigate ke "Kelola Kategori" (untuk admin)
2. Klik "Tambah Kategori"
3. Masukkan nama kategori
4. Submit

### 5. Request Menjadi Staff

#### Untuk User:
1. Go to "Request Staff" page
2. Pilih outlet yang ingin dilamar
3. Pilih role yang diinginkan
4. Submit request
5. Tunggu approval dari owner outlet

#### Untuk Owner Outlet:
1. Check incoming requests di dashboard
2. Review applicant profile
3. Approve atau reject request
4. User akan mendapat notifikasi

### 6. Transaksi

#### Membuat Transaksi:
1. Pilih outlet
2. Tambahkan produk ke keranjang
3. Set jumlah produk
4. Pilih jenis transaksi
5. Submit transaksi
6. Data tersimpan di database

#### Melihat Riwayat:
- Access history page
- Filter by date, outlet, atau kategori
- Export data jika diperlukan

### 7. Settings

#### Update Profile:
1. Go to Settings > Profile
2. Update informasi:
   - Name
   - Email
   - Avatar
3. Save changes

#### Appearance:
1. Go to Settings > Appearance
2. Customize theme preferences
3. Save settings

## 📁 Struktur Project

```
Hubo/
├── app/
│   ├── Http/
│   │   ├── Controllers/          # Application controllers
│   │   │   ├── Auth/            # Authentication controllers
│   │   │   ├── Settings/        # Settings controllers
│   │   │   ├── HomepageController.php
│   │   │   ├── KategoriController.php
│   │   │   ├── OutletController.php
│   │   │   ├── ProdukController.php
│   │   │   ├── TransaksiController.php
│   │   │   └── RequestStaffController.php
│   │   ├── Middleware/          # Custom middleware
│   │   └── Requests/            # Form requests
│   ├── Models/                  # Eloquent models
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Outlet.php
│   │   ├── Produk.php
│   │   ├── Kategori.php
│   │   ├── Transaksi.php
│   │   ├── KeranjangBelanjaUser.php
│   │   └── KeranjangBelanjaKasir.php
│   └── Providers/               # Service providers
├── bootstrap/                   # Bootstrap files
├── config/                      # Configuration files
├── database/
│   ├── factories/              # Model factories
│   ├── migrations/             # Database migrations
│   └── seeders/                # Database seeders
├── public/                     # Public assets
│   └── storage/                # Symlinked storage
├── resources/
│   ├── css/                    # CSS files
│   ├── js/                     # React/TypeScript files
│   │   ├── components/         # React components
│   │   ├── layouts/            # Layout components
│   │   ├── pages/              # Page components
│   │   │   ├── akun_users/    # User account pages
│   │   │   ├── akun_admin_app/ # Admin pages
│   │   │   └── settings/      # Settings pages
│   │   ├── lib/                # Utility functions
│   │   └── types/              # TypeScript types
│   └── views/                  # Blade templates (minimal)
├── routes/
│   ├── web.php                 # Web routes
│   ├── auth.php                # Authentication routes
│   ├── settings.php            # Settings routes
│   └── console.php             # Console commands
├── storage/                    # Storage directory
│   ├── app/                    # Application files
│   ├── framework/              # Framework files
│   └── logs/                   # Log files
├── tests/                      # Test files
│   ├── Feature/                # Feature tests
│   └── Unit/                   # Unit tests
├── vendor/                     # Composer dependencies
├── .env                        # Environment variables
├── composer.json               # PHP dependencies
├── package.json                # Node dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── tailwind.config.js          # Tailwind configuration
└── phpunit.xml                 # PHPUnit configuration
```

## 🧪 Testing

### PHP Testing dengan Pest

#### Run All Tests
```bash
php artisan test
```

#### Run Specific Test
```bash
php artisan test --filter=OutletTest
```

#### Run with Coverage
```bash
php artisan test --coverage
```

### TypeScript Type Checking
```bash
npm run types
```

## 📜 Scripts NPM

| Script | Command | Deskripsi |
|--------|---------|-----------|
| **dev** | `npm run dev` | Start Vite development server |
| **build** | `npm run build` | Build production assets |
| **build:ssr** | `npm run build:ssr` | Build with SSR support |
| **format** | `npm run format` | Format code dengan Prettier |
| **format:check** | `npm run format:check` | Check code formatting |
| **lint** | `npm run lint` | Lint & fix dengan ESLint |
| **types** | `npm run types` | TypeScript type checking |

## 🛣️ API Routes

### Public Routes
```
GET  /                          # Welcome page
```

### Authentication Routes
```
GET  /login                     # Login page
GET  /authenticate              # WorkOS authentication callback
POST /logout                    # Logout
```

### Protected Routes (Require Authentication)

#### Dashboard & Profile
```
GET  /homepage                  # Homepage
GET  /dashboard                 # User dashboard
GET  /myprofile                 # User profile page
```

#### Outlet Management
```
GET    /myoutlet               # List outlets
POST   /myoutlet               # Create outlet
PUT    /myoutlet/{outlet}      # Update outlet
DELETE /myoutlet/{outlet}      # Delete outlet
```

#### Product Management
```
GET    /produk/{outlet_id}     # List products by outlet
POST   /produk                 # Create product
PUT    /produk/{produk}        # Update product
DELETE /produk/{produk}        # Delete product
```

#### Category Management
```
GET    /kelola_kategori        # List categories
POST   /kelola_kategori        # Create category
PUT    /kelola_kategori/{kategori}    # Update category
DELETE /kelola_kategori/{kategori}    # Delete category
```

#### Product Management Page
```
GET  /kelola_produk            # Product management dashboard
```

#### Staff Request
```
GET  /req_staff                # Request staff page
POST /req_staff                # Submit staff request
```

#### Settings
```
GET    /settings/profile       # Profile settings
PATCH  /settings/profile       # Update profile
DELETE /settings/profile       # Delete account
GET    /settings/appearance    # Appearance settings
```

## 🗄️ Database Schema

### Main Tables:
- **users** - User accounts dan authentication
- **roles** - User roles (Admin, Owner, Staff, Kasir, User)
- **outlets** - Outlet information
- **outlet_user** - Pivot table untuk many-to-many relationship
- **kategoris** - Product categories
- **produks** - Products inventory
- **transaksis** - Transaction records
- **keranjang_belanja_users** - User shopping cart
- **keranjang_belanja_kasirs** - Cashier shopping cart
- **request_roles** - Role request system

### Features:
- Soft deletes pada semua main tables
- Timestamps (created_at, updated_at)
- Foreign key constraints
- Indexing untuk optimasi query

### PostgreSQL Advantages:
- **ACID Compliance** - Data integrity dan consistency terjamin
- **Advanced Data Types** - Support untuk JSON, Array, dan custom types
- **Full-Text Search** - Built-in search capabilities
- **Concurrent Performance** - MVCC untuk handling multiple transactions
- **Reliability** - Proven stability untuk production environments
- **Scalability** - Excellent performance untuk large datasets

## 🔐 Security Features

- **CSRF Protection** - Laravel built-in CSRF token
- **SQL Injection Prevention** - Eloquent ORM
- **XSS Protection** - React auto-escaping
- **Session Security** - WorkOS session validation
- **Password Hashing** - Bcrypt hashing
- **Rate Limiting** - API throttling
- **Middleware Protection** - Route guards

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach
- **Dark Mode** (jika implemented)
- **Accessibility** - ARIA labels dan keyboard navigation
- **Loading States** - Skeleton loaders
- **Error Handling** - User-friendly error messages
- **Animations** - Smooth transitions dengan Framer Motion
- **Toast Notifications** - Real-time feedback

## 🚀 Deployment

### Production Build
```bash
# Install dependencies
composer install --optimize-autoloader --no-dev
npm install

# Build assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force
```

### Server Requirements
- PHP 8.2+ dengan extensions: BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, PDO_PGSQL, Tokenizer, XML
- Composer 2.x
- Node.js 18+ (untuk build assets)
- PostgreSQL 13.0+
- Web server (Apache/Nginx)

### Recommended Hosting
- Laravel Forge
- AWS EC2
- DigitalOcean
- Heroku (dengan buildpacks)

## 🐛 Troubleshooting

### Common Issues:

**1. Vite Build Error**
```bash
# Clear node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. Database Connection Error**
- Check `.env` database credentials
- Verify PostgreSQL service is running
- Check database exists dan user memiliki permission

**3. WorkOS Authentication Error**
- Verify API keys di `.env`
- Check redirect URLs di WorkOS dashboard
- Clear browser cache dan cookies

**4. Storage Permission Error**
```bash
# Set proper permissions
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

**5. Composer Memory Limit**
```bash
# Increase memory limit
php -d memory_limit=-1 /usr/local/bin/composer install
```

**6. PostgreSQL Connection Issues**
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-15

# Linux/Mac - Start PostgreSQL service
sudo service postgresql start
# atau
sudo systemctl start postgresql

# Check PostgreSQL status
# Windows
pg_isready
# Linux/Mac
sudo service postgresql status

# Test connection
psql -U postgres -h 127.0.0.1 -d hubo_db
```

**7. Missing PDO_PGSQL Extension**
```bash
# Ubuntu/Debian
sudo apt-get install php8.2-pgsql
sudo service apache2 restart

# Windows (XAMPP/WAMP)
# Uncomment extension=pdo_pgsql di php.ini

# Mac (Homebrew)
brew install php@8.2
pecl install pdo_pgsql
```

## 📝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 Lisensi

This project is licensed under the MIT License.

## 👥 Team

Developed with ❤️ by Hubo Development Team

## 📞 Support

Untuk pertanyaan dan support:
- Email: support@hubo.app
- Issues: GitHub Issues
- Documentation: [Project Wiki]

---

**© 2026 Hubo. All rights reserved.**
