#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE zitadel' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'zitadel')\gexec
    GRANT ALL PRIVILEGES ON DATABASE zitadel TO $POSTGRES_USER;
EOSQL
