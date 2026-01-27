# Sigetsop API 🛡️

El núcleo backend del Sistema de Gestión de Trabajo Social Policial (Sigetsop). Proporciona una API robusta para la administración de personal, procesamiento automatizado de documentos mediante OCR y seguimiento en tiempo real de registros médicos.

## 🚀 Tecnologías
- **Framework:** Django 5.2.7 & Django REST Framework (DRF) 3.16.1
- **Tiempo Real:** Django Channels & Redis (WebSockets)
- **Base de Datos:** PostgreSQL
- **Procesamiento de Documentos:** PaddleOCR para extracción automatizada de datos
- **Reportes:** Motor de exportación PDF (WeasyPrint) y CSV
- **Autenticación:** JWT (SimpleJWT)

## 📂 Arquitectura del Proyecto
Organizado en módulos independientes (Django Apps):
- **`police_personnel`**: Registro centralizado y historial del personal policial.
- **`affiliationavc09`, `avc04`, `avc07`**: Módulos especializados en OCR para formularios de afiliación.
- **`sick_leave`**: Gestión y reporte de bajas médicas.
- **`hospital`**: Catálogo y gestión de centros médicos asociados.
- **`prenatal_care` & `natal_data`**: Seguimiento especializado de maternidad y natalidad.
- **`users`**: Gestión de usuarios con control de acceso basado en roles (RBAC).

## 🛠️ Instalación y Configuración
1. **Configurar el Entorno:**
   ```bash
   conda env create -f environment.yml
   conda activate sigetsop
   ```
2. **Base de Datos:**
   Configura tu archivo `.env` y ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```
3. **Ejecutar el Sistema:**
   ```bash
   # Servidor HTTP de desarrollo
   python manage.py runserver
   # Servidor ASGI (Requerido para WebSockets)
   daphne -p 8000 server.asgi:application
   ```
