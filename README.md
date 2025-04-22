# Task Management System

Sistem manajemen tugas (Task Management) yang dibuat dengan NestJS, PostgreSQL, dan Redis.

## Fitur

**1. Authentication & Authorization**
* JWT Authentication
* Role-based access control (Admin, User)

**2. Database**
* Entity: User, Task
* Relasi: One-to-Many (1 User punya banyak Tasks)
* Transaksi: Saat assign task ke user dan update status

**3. External API Integration**
* Integrasi ke Holiday API — untuk tandai task tidak bisa dikerjakan saat hari libur

**Fitur Bonus**
* Caching (Redis) - Simpan hasil fetch API eksternal (libur nasional)
* Logging - Menggunakan Logger bawaan NestJS + interceptor

## Setup dengan Docker

### Prasyarat

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/)

### Langkah-langkah

1. Clone repository ini:
   ```bash
   git clone <repository-url>
   cd task-management-system
   ```

2. Buat file `.env` dari file contoh:
   ```bash
   cp .env.example .env
   ```

3. Jalankan dengan Docker Compose:
   ```bash
   docker-compose up -d
   ```

   Ini akan menjalankan:
   - Aplikasi NestJS di port 3000
   - PostgreSQL di port 5432
   - Redis di port 6379
   - PgAdmin di port 5050 (opsional, untuk mengelola database)

4. Aplikasi dapat diakses di [http://localhost:3000](http://localhost:3000)

5. PgAdmin (untuk mengelola database) dapat diakses di [http://localhost:5050](http://localhost:5050)
   - Email: admin@admin.com
   - Password: admin

### Pengembangan

Saat container berjalan, perubahan kode akan otomatis di-reload berkat volume mapping dan mode development.

### Deployment Produksi

Untuk deployment ke produksi, gunakan file docker-compose.prod.yml:

```bash
# Pastikan variabel lingkungan yang dibutuhkan tersedia
export DB_PASSWORD=strong_password
export JWT_SECRET=secure_jwt_secret
export REDIS_PASSWORD=redis_secure_password

docker-compose -f docker-compose.prod.yml up -d
```

## Struktur Project

```
src/
├── auth/                           # Modul autentikasi
├── users/                          # Modul pengguna
├── tasks/                          # Modul task management
├── common/                         # Komponen yang digunakan bersama
│   └── guards/                     # Guards untuk otentikasi dan otorisasi
│   └── decorators/                 # Decorator untuk public dan roles
│   └── interceptors/               # Interceptor untuk logging
├── external/                       # Integrasi API eksternal
│   └── holiday-api/                # Integrasi dengan API Holiday
├── main.ts                         # Entry point aplikasi
└── app.module.ts                   # Modul utama aplikasi
```

## API Endpoints

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | /auth/register | public | Daftar akun |
| POST | /auth/login | public | Login |
| GET | /tasks | user | Lihat task |
| POST | /tasks | user | Tambah task |
| PATCH | /tasks/:id | user | Update task |
| DELETE | /tasks/:id | user | Hapus task |
| PATCH | /tasks/:id/assign | admin | Assign task ke user |
| GET | /holidays/:year | user | Ambil data libur nasional dari API eksternal |
| GET | /holidays/check | user | Cek apakah tanggal tertentu libur |

## Pengembangan Tanpa Docker

### Prasyarat

* Node.js (>= 14.x)
* PostgreSQL
* Redis

### Instalasi

```bash
npm install
```

### Konfigurasi

Siapkan file `.env` dengan contoh di `.env.example`.

### Menjalankan Aplikasi

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```