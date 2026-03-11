# 🚀 SigetsopProject - Guía de Despliegue con Docker

Este proyecto está configurado para un despliegue rápido y seguro utilizando **Docker** y **Docker Compose**. Esta arquitectura permite servir el frontend (React), la API (Django/Daphne), la base de datos (PostgreSQL) y el sistema de mensajería (Redis) de forma aislada y eficiente.

---

## 🏗️ Arquitectura de Producción

- **Frontend/Nginx**: Puerto público `6090` (Punto de entrada).
- **Backend (API/WebSockets)**: Gestionado por Daphne internamente.
- **Base de Datos**: PostgreSQL 16.
- **Cache/WebSockets**: Redis 7.
- **IP Producción**: `200.110.50.35`

---

## 🔐 Requisitos de Red (Firewall)

Para que el sistema funcione correctamente desde fuera de la red local (celulares o sedes remotas), es **obligatorio** abrir los siguientes puertos en el servidor:

| Puerto | Servicio | Descripción |
| :--- | :--- | :--- |
| **6090** | Frontend (Nginx) | Acceso principal a la aplicación web. |
| **8000** | Backend (API) | Comunicación directa con la API y WebSockets. |

---

## 🛠️ Pasos para el Despliegue

### 1. Configuración de Entorno
Copia los archivos de ejemplo para crear los archivos de configuración reales:
```bash
cp sigetsop-api/.env.example sigetsop-api/.env
cp sigetsop-web/.env.example sigetsop-web/.env
```

### 2. Levantar la Infraestructura
Construye las imágenes e inicia los servicios en segundo plano:
```bash
docker compose up -d --build
```

### 3. Preparar la Base de Datos
Ejecuta las migraciones de Django:
```bash
docker exec -it sigetsop_backend python manage.py migrate
```

### 4. Importación de Datos Policiales (`sigetsop_police.sql`)
Importa los datos históricos respetando las dependencias circulares:
```bash
(echo "SET session_replication_role = 'replica';"; cat sigetsop_police.sql; echo "SET session_replication_role = 'origin';") | docker exec -i sigetsop_db psql -U sigetsop -d sigetsop_db
```

---

## 📱 Flujo de Autenticación Móvil (QR)

El sistema permite vincular un celular mediante un código QR para subir documentos directamente.
1. La **PC** genera un token de sesión unificado en el backend.
2. El **Celular** escanea el QR y consume dicho token validando la sesión.
3. El backend devuelve un **JWT** al celular para autenticar las subidas de archivos.

> **Nota**: Si cambias la IP del servidor en `docker-compose.yml`, debes reconstruir el frontend obligatoriamente con `docker compose build --no-cache frontend` para inyectar la nueva IP en el cliente.

---

## 🔍 Mantenimiento y Logs

### Ver Logs de los Contenedores
```bash
docker compose logs -f [nombre_servicio]
```

### Reconstrucción Total (Cambio de IPs)
```bash
docker compose up -d --build
```

---
**Nina 2025**
