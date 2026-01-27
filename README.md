# 🚀 SigetsopProject Deployment Guide

Este repositorio contiene la configuración unificada para el despliegue en producción del sistema Sigetsop, optimizado para el servidor externo.

## 🏗️ Arquitectura de Red
- **Frontend/Nginx**: Puerto `6090` (Punto de entrada único).
- **Backend (API)**: Puerto `8000` (Interno, gestionado por Nginx).
- **IP Servidor Externo**: `200.110.50.35`

---

## 🛠️ Requisitos Previos
1. Docker y Docker Compose instalados en el servidor.
2. Puerto `6090` abierto en el firewall (Inbound).

## 🚀 Pasos para el Despliegue

### 1. Configuración de Entorno
Copia los archivos de ejemplo y edítalos con las credenciales reales:
```bash
cp sigetsop-api/.env.example sigetsop-api/.env
cp sigetsop-web/.env.example sigetsop-web/.env
```

### 2. Levantar la Infraestructura
Construye las imágenes y levanta los servicios en segundo plano:
```bash
docker-compose up --build -d
```
*Nota: La opción `--build` es necesaria para inyectar la IP del servidor en el bundle del frontend.*

### 3. Preparar el Backend
Ejecuta las migraciones y recolecta archivos estáticos:
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --no-input
```

---

## 💾 Migración de Datos (`sigetsop_police`)

Para migrar tus datos actuales al servidor externo:

1. **En tu PC local (Exportar)**:
   ```bash
   pg_dump -U postgres -h localhost sigetsop_police > backup_data.sql
   ```

2. **En el Servidor Externo (Importar)**:
   Asegúrate de que el contenedor de base de datos esté corriendo y ejecuta:
   ```bash
   cat backup_data.sql | docker exec -i sigetsop_db psql -U sigetsop -d ddsbs
   ```

---

## 🔍 Comandos Útiles
- **Ver logs**: `docker-compose logs -f`
- **Reiniciar servicios**: `docker-compose restart`
- **Detener todo**: `docker-compose down`

---
**Desarrollado por: Sigetsop Team 2025**
