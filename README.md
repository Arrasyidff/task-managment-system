# Task Management System API

Task Management System adalah aplikasi backend berbasis REST API yang dikembangkan dengan NestJS framework. Sistem ini memungkinkan pengguna untuk membuat, mengelola, dan melacak tugas dengan berbagai fitur seperti autentikasi, otorisasi berbasis peran, dan integrasi dengan layanan eksternal.

## Fitur Utama

### Autentikasi & Otorisasi
- JWT Authentication
- Role-based Access Control (Admin, User)
- Password hashing dan keamanan

### Manajemen Task
- CRUD operasi lengkap (Create, Read, Update, Delete)
- Filter task berdasarkan status, prioritas
- Sorting task berdasarkan berbagai kriteria
- Assign task ke user (Admin only)

### Integrasi API Eksternal
- Integrasi dengan Holiday API untuk mendapatkan data hari libur
- Verifikasi tanggal tugas terhadap hari libur

### Optimasi & Performa
- Redis caching untuk hasil API eksternal
- Logging untuk monitoring dan debugging

### Database
- Relasi one-to-many antara User dan Task
- Transaction management untuk operasi kritis
- Data validation menggunakan DTO

## Teknologi yang Digunakan

- **NestJS**: Framework backend modern untuk Node.js
- **TypeScript**: Static typing untuk JavaScript
- **TypeORM**: Object Relational Mapping untuk database
- **PostgreSQL**: Database relasional
- **Redis**: Cache management
- **JWT**: JSON Web Token untuk autentikasi
- **Jest & Supertest**: Testing framework
- **Docker**: Containerization dan deployment
- **class-validator & class-transformer**: Validasi data dan transformasi

## Struktur Proyek

```
src/
├── auth/                       # Autentikasi dan otorisasi
│   ├── dto/
│   ├── interfaces/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/                      # Manajemen user
│   ├── dto/
│   ├── entities/
│   ├── enums/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── tasks/                      # Manajemen task
│   ├── dto/
│   ├── entities/
│   ├── tasks.controller.ts
│   ├── tasks.module.ts
│   └── tasks.service.ts
├── common/                     # Komponen umum yang digunakan
│   ├── guards/
│   ├── decorators/
│   └── interceptors/
├── external/                   # Integrasi API eksternal
│   └── holiday-api/
├── main.ts                     # Entry point aplikasi
└── app.module.ts               # Root module
```

## API Endpoints

### Authentication
- `POST /auth/register` - Registrasi user baru
- `POST /auth/login` - Login dan mendapatkan token JWT

### Tasks
- `GET /tasks` - Mendapatkan daftar task
- `GET /tasks/:id` - Mendapatkan detail task
- `POST /tasks` - Membuat task baru
- `PATCH /tasks/:id` - Mengupdate task
- `DELETE /tasks/:id` - Menghapus task
- `PATCH /tasks/:id/assign` - Assign task ke user (Admin only)

### External API
- `GET /holidays/:year` - Mendapatkan daftar hari libur berdasarkan tahun
- `GET /health` - Health check endpoint

## Cara Menjalankan

### Prasyarat
- Docker & Docker Compose
- Node.js (untuk pengembangan lokal)
- npm atau yarn

### Menggunakan Docker

1. Clone repository
```bash
git clone <repository-url>
cd task-management-system
```

2. Setup environment variables
```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

3. Jalankan dengan Docker Compose
```bash
# Mode development
docker-compose up -d
```

4. Akses API di `http://localhost:3001`

### Development Lokal
- Versi node yang dipakai adalah v20.3.0
1. Install dependencies
```bash
npm install
```

2. Setup database PostgreSQL dan Redis

3. Jalankan aplikasi
```bash
npm run start:dev
```

## Design Patterns

Sistem mengimplementasikan beberapa design pattern modern:
- Repository Pattern
- Dependency Injection
- DTO Pattern
- Guards dan Interceptors
- Decorator Pattern

## Lisensi

[MIT](LICENSE)