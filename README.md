# Therians App (MVP bootstrap)

Monorepo inicial para construir el MVP definido en `ARCHITECTURE_SPEC_THERIANS_APP.md`.

## Estructura
- `apps/frontend`: React + TypeScript (Vite)
- `apps/backend`: NestJS + TypeScript
- `docker-compose.yml`: PostgreSQL (PostGIS) + Redis local

## Inicio rápido
1. `npm install`
2. `docker compose up -d`
3. `npm run dev:backend`
4. `npm run dev:frontend`

## Próximos pasos
- Implementar Auth + Users + Profiles.
- Añadir migraciones PostgreSQL y seed inicial.
- Conectar frontend con API base `/api/v1`.
