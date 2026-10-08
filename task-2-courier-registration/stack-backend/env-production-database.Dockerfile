FROM postgres:15.3-alpine3.18
COPY env-production-init-database.sh /docker-entrypoint-initdb.d