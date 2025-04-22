#!/bin/bash

# Script untuk mempermudah setup dan menjalankan aplikasi Task Management

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Task Management System Setup ===${NC}"

# Cek apakah Docker dan Docker Compose terinstal
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker dan Docker Compose diperlukan untuk menjalankan aplikasi ini${NC}"
    echo -e "Silakan install Docker: https://docs.docker.com/get-docker/"
    echo -e "dan Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Cek apakah .env sudah ada, jika tidak, buat dari contoh
if [ ! -f .env ]; then
    echo -e "${YELLOW}File .env tidak ditemukan. Membuat dari .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}File .env berhasil dibuat!${NC}"
    else
        echo -e "${RED}ERROR: File .env.example tidak ditemukan!${NC}"
        echo "JWT_SECRET=super_secret_jwt_key" > .env
        echo "PORT=3000" >> .env
        echo "NODE_ENV=development" >> .env
        echo "DB_HOST=postgres" >> .env
        echo "DB_PORT=5432" >> .env
        echo "DB_USERNAME=postgres" >> .env
        echo "DB_PASSWORD=postgres" >> .env
        echo "DB_DATABASE=task_management" >> .env
        echo "DB_SYNC=true" >> .env
        echo "REDIS_HOST=redis" >> .env
        echo "REDIS_PORT=6379" >> .env
        echo "COUNTRY_CODE=ID" >> .env
        echo -e "${GREEN}File .env default berhasil dibuat!${NC}"
    fi
fi

# Tanyakan mode yang diinginkan
echo -e "${YELLOW}Pilih mode:${NC}"
echo "1) Development (hot-reload, volume mounts)"
echo "2) Production"
read -p "Pilihan [1]: " mode

# Default ke development jika tidak ada input
mode=${mode:-1}

if [ "$mode" == "1" ]; then
    echo -e "${GREEN}Menjalankan dalam mode development...${NC}"
    docker-compose up -d
elif [ "$mode" == "2" ]; then
    echo -e "${GREEN}Menjalankan dalam mode production...${NC}"
    
    # Cek apakah variabel lingkungan yang diperlukan sudah diatur
    if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$REDIS_PASSWORD" ]; then
        echo -e "${YELLOW}Variabel lingkungan belum diatur. Menggunakan nilai default untuk demo...${NC}"
        export DB_PASSWORD=strong_postgres_password
        export JWT_SECRET=strong_jwt_secret_key
        export REDIS_PASSWORD=strong_redis_password
        echo -e "${YELLOW}PERINGATAN: Gunakan password yang kuat di lingkungan produksi nyata!${NC}"
    fi
    
    docker-compose -f docker-compose.prod.yml up -d
else
    echo -e "${RED}Pilihan tidak valid!${NC}"
    exit 1
fi

# Tampilkan informasi setelah container berjalan
echo -e "${GREEN}=== Aplikasi sedang berjalan ===${NC}"
echo -e "${YELLOW}Endpoints yang tersedia:${NC}"
echo "- API: http://localhost:3000"

if [ "$mode" == "1" ]; then
    echo "- PgAdmin (Database management): http://localhost:5050"
    echo "  Email: admin@admin.com"
    echo "  Password: admin"
fi

echo -e "${YELLOW}Untuk menghentikan aplikasi:${NC}"
if [ "$mode" == "1" ]; then
    echo "docker-compose down"
else
    echo "docker-compose -f docker-compose.prod.yml down"
fi

echo -e "${GREEN}=== Setup selesai! ===${NC}"