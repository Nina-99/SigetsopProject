# 🚀 SigetsopProject - Guía de Despliegue Nativo

Este proyecto ha sido optimizado para ejecutarse de forma nativa en **Debian 12 (Bookworm)**, utilizando **Nginx** como servidor web y **Daphne (ASGI)** para la API y WebSockets.

---

## 🏗️ Arquitectura de Producción

- **Frontend**: Servido por Nginx en el puerto `80`.
- **Backend (API/WS)**: Gestionado por Daphne en el puerto `8000` (interno).
- **Base de Datos**: PostgreSQL 15.
- **Cache/WebSockets**: Redis Server.

---

## 🛠️ Instalación Automatizada

El despliegue es completamente automático y no requiere configuración manual de archivos `.env`.

### 1. Preparar el Script
Otorga permisos de ejecución al script de despliegue:

```bash
chmod +x deploy_sigetsop.sh
```

### 2. Ejecutar el Despliegue
Ejecuta el script (se recomienda usar `sudo` ya que instalará dependencias de sistema y configurará Nginx):

```bash
sudo ./deploy_sigetsop.sh
```

> **Nota sobre la IP**: El script detectará automáticamente tu IP pública (ej. `200.110.50.35`) y configurará tanto el Frontend como el Backend para funcionar con ella. Si deseas forzar una IP o dominio específico, puedes pasarlo como argumento: `./deploy_sigetsop.sh mi-dominio.com`.

---

## 💾 Datos y Migraciones

El script realiza automáticamente las siguientes acciones:
1. Ejecuta `python manage.py migrate` para crear la estructura.
2. Importa el archivo `sigetsop_police.sql`.
3. Gestiona las dependencias circulares entre **Unidades** y **Personal** desactivando temporalmente las restricciones de integridad.

---

## 🔍 Mantenimiento y Logs

### Crear Superusuario
Para acceder al panel de administración de Django:
```bash
cd sigetsop-api
source venv/bin/activate
python manage.py createsuperuser
```

### Ver Logs en Tiempo Real
Si necesitas depurar el backend o el procesamiento de OCR:
```bash
sudo journalctl -u sigetsop-backend -f
```

### Reiniciar Servicios
Si realizas cambios en el código del backend:
```bash
sudo systemctl restart sigetsop-backend
```

Si cambias el frontend, deberás ejecutar `npm run build` en la carpeta `sigetsop-web`.

---

**Desarrollado por: Nina 2025**
