#!/bin/bash

# Configuration
DB_NAME="sigetsop_db"
DB_USER="salud10"
DOCKER_CONTAINER="sigetsop_db"
export PGPASSWORD="sal140op-"

# List of tables to migrate
TABLES=(
    "grades"
    "police_personnel"
    "police_unit"
    "police_unit_assistant"
    "hospital"
    "file_personnel"
)

echo "🚀 Starting migration of specific tables..."

# 1. Export tables from local database
# Assuming the local DB is accessible via the current environment
echo "📦 Exporting tables from local database..."
pg_dump -U $DB_USER -d $DB_NAME \
    ${TABLES[@]/#/-t } \
    --data-only --column-inserts > tables_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Export successful: tables_data.sql"
else
    echo "❌ Export failed. Make sure pg_dump is installed and DB is accessible."
    exit 1
fi

# 2. Upload to Docker container
echo "📤 Uploading data to Docker container..."
docker cp tables_data.sql $DOCKER_CONTAINER:/tmp/tables_data.sql

# 3. Import into Docker database
echo "📥 Importing data into Docker database..."
# Note: This assumes migrations have already run in the container to create the schema
docker exec -it $DOCKER_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/tables_data.sql

if [ $? -eq 0 ]; then
    echo "🎉 Migration completed successfully!"
else
    echo "❌ Import failed. Check if the schema exists in the Docker database."
fi

# Cleanup
rm tables_data.sql
