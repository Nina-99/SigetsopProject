# 🚀 SigetsopProject - Guía de Despliegue con Docker

Este proyecto está configurado para un despliegue rápido y seguro utilizando **Docker** y **Docker Compose**. Esta arquitectura permite servir el frontend (React), la API (Django/Daphne), la base de datos (PostgreSQL) y el sistema de mensajería (Redis) de forma aislada y eficiente.

---

## 🏗️ Arquitectura de Producción

- **Frontend/Nginx**: Puerto público `6090` (Punto de entrada).
- **Backend (API/WebSockets)**: Gestionado por Daphne internamente.
- **Base de Datos**: PostgreSQL 16.
- **Cache/WebSockets**: Redis 7.
- **IP Servidor**: `200.110.50.35`

---

## 🛠️ Requisitos Previos

1. Docker y Docker Compose instalados.
2. Tu usuario debe tener permisos para ejecutar Docker (pertenecer al grupo `docker`).

---

## 🚀 Pasos para el Despliegue

### 1. Configuración de Entorno

Copia los archivos de ejemplo para crear los archivos de configuración reales:

```bash
cp sigetsop-api/.env.example sigetsop-api/.env
cp sigetsop-web/.env.example sigetsop-web/.env
```

### 2. Levantar la Infraestructura

Construye las imágenes e inicia los servicios en segundo plano:

```bash
docker-compose up --build -d
```

### 3. Preparar la Base de Datos

Ejecuta las migraciones de Django:

```bash
docker exec -it sigetsop_backend python manage.py migrate
```

### 4. Importación de Datos Policiales (`sigetsop_police.sql`)

Importa los datos históricos respetando las dependencias circulares (Unidades -> Personal):

```bash
(echo "SET session_replication_role = 'replica';"; cat sigetsop_police.sql; echo "SET session_replication_role = 'origin';") | docker exec -i sigetsop_db psql -U sigetsop -d sigetsop_db
```

### 5. Crear Superusuario

Para acceder al panel de administración:

```bash
docker exec -it sigetsop_backend python manage.py createsuperuser
```

---

## 🔍 Mantenimiento y Logs

### Ver Logs de los Contenedores

```bash
docker-compose logs -f [nombre_servicio]
```

### Reiniciar un Servicio Específico

```bash
docker-compose restart backend
```

---

## 💾 Despliegue Nativo (Alternativo)

Si dispones de privilegios de root y prefieres una instalación directa en el sistema, puedes utilizar el script legacy: `deploy_sigetsop.sh`.

---

**Desarrollado por: Nina 2025**
