#!/bin/bash
#
# Project: SigetsopProject - Auto Deployment Script
# Target OS: Debian 12 (Bookworm)
#

# --- Configuración de Variables ---
DB_NAME="sigetsop_db"
DB_USER="sigetsop_user"
DB_PASS="sigetsop_password" # Se recomienda cambiar después
PROJECT_ROOT=$(pwd)

# Verificar que estamos en la raíz del proyecto
if [ ! -d "$PROJECT_ROOT/sigetsop-api" ] || [ ! -d "$PROJECT_ROOT/sigetsop-web" ]; then
    echo "❌ Error: El script debe ejecutarse desde la raíz del proyecto SigetsopProject."
    exit 1
fi

BACKEND_DIR="$PROJECT_ROOT/sigetsop-api"
FRONTEND_DIR="$PROJECT_ROOT/sigetsop-web"

# Detección inteligente de IP (1. Argumento, 2. Pública via Curl, 3. Primera IP de hostname)
SERVER_IP=${1:-$(curl -s ifconfig.me || hostname -I | awk '{print $1}')}

echo "--- 🛠️ Iniciando Instalación de SigetsopProject ---"
echo "📍 IP Detectada para Despliegue: $SERVER_IP"

# 1. Instalación de dependencias de sistema
echo "📦 Instalando paquetes de sistema..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib \
    redis-server nginx nodejs npm git libpq-dev \
    libgl1-mesa-glx libglib2.0-0 tesseract-ocr

# 2. Configuración de PostgreSQL
echo "🗄️ Configurando base de datos..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 3. Preparación del Backend
echo "🐍 Configurando Backend (Django + Daphne)..."
cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install daphne

# Crear .env para producción
cat <<EOF > .env
DEBUG=False
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(24))')
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_URL=redis://127.0.0.1:6379/0
# Permitimos la IP detectada y un comodín para portabilidad extrema
DJANGO_ALLOWED_HOSTS=$SERVER_IP,*,localhost,127.0.0.1
EOF

# Ejecutar migraciones
python manage.py migrate

# 4. Importación de Datos (Manejo de dependencias circulares)
echo "📥 Importando datos desde sigetsop_police.sql..."
export PGPASSWORD=$DB_PASS
# Usamos session_replication_role para omitir temporalmente los checks de FK
psql -h localhost -U $DB_USER -d $DB_NAME -c "SET session_replication_role = 'replica';"
psql -h localhost -U $DB_USER -d $DB_NAME -f "$PROJECT_ROOT/sigetsop_police.sql"
psql -h localhost -U $DB_USER -d $DB_NAME -c "SET session_replication_role = 'origin';"

# 5. Preparación del Frontend
echo "⚛️ Configurando Frontend (React)..."
cd "$FRONTEND_DIR"
npm install
cat <<EOF > .env
VITE_API_URL=http://$SERVER_IP/api
VITE_WS_URL=ws://$SERVER_IP/ws
EOF
npm run build

# 6. Configuración de servicios de sistema (Daphne)
echo "⚙️ Configurando Daphne como servicio..."
sudo bash -c "cat <<EOF > /etc/systemd/system/sigetsop-backend.service
[Unit]
Description=Daphne ASGI for Sigetsop
After=network.target redis-server.service

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/daphne -b 0.0.0.0 -p 8000 server.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable sigetsop-backend
sudo systemctl start sigetsop-backend

# 7. Configuración de Nginx (Proxy Inverso)
echo "🌐 Configurando Nginx..."
sudo bash -c "cat <<EOF > /etc/nginx/sites-available/sigetsop
server {
    listen 80;
    server_name _; # Responde a cualquier IP o dominio que apunte aquí

    location / {
        root $FRONTEND_DIR/dist;
        index index.html;
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
    }

    location /static/backend/ {
        alias $BACKEND_DIR/static/;
    }

    location /media/ {
        alias $BACKEND_DIR/media/;
    }
}
EOF"

sudo ln -s /etc/nginx/sites-available/sigetsop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "--- ✅ Instalación Completa ---"
echo "URL: http://$SERVER_IP"
