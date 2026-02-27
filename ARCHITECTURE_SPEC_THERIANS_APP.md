# Especificación técnica y plan de implementación — App tipo “Tinder” para comunidad therian + módulo de adopción

## Supuestos aplicados
- **Mercado objetivo:** Colombia/LATAM (arquitectura preparada para expansión global).
- **Plataformas:** Web responsive primero (desktop/mobile web). Estrategia mobile descrita en React (React Native opcional fase 2).
- **Política de edad:** 18+ por defecto.
- **Idioma:** Español (i18n preparado para futuro EN/PT).

---

## A) Requisitos y alcance

### Historias de usuario clave (MVP)
- Como **usuario therian**, quiero crear mi perfil con fotos, intereses y preferencias para encontrar matches relevantes.
- Como **usuario**, quiero dar like/nope con filtros por distancia/edad/intereses para mejorar afinidad.
- Como **usuario**, quiero chatear solo con matches mutuos y poder bloquear/reportar.
- Como **partner (refugio/veterinaria)**, quiero publicar mascotas con estado y requisitos.
- Como **usuario**, quiero postular a adopción con formulario y adjuntos.
- Como **partner**, quiero mover solicitudes por etapas y registrar eventos del proceso.
- Como **admin**, quiero auditar acciones críticas, moderar reportes y aplicar sanciones.

### Reglas de negocio
- **Matching**
  - Match se crea solo con like mutuo.
  - No se muestran perfiles bloqueados/reportados críticamente.
  - Distancia por defecto aproximada (radio configurable), geolocalización exacta solo con consentimiento explícito.
- **Chat**
  - Chat habilitado solo para match activo.
  - Límite de frecuencia de mensajes por usuario para anti-spam.
  - Bloqueo rompe visibilidad de conversación para ambas partes (historial preservado para auditoría interna).
- **Adopción**
  - Una solicitud activa por mascota por usuario (configurable).
  - Flujo con estados obligatorios y eventos trazables.
  - Cambio a `approved` requiere checklist mínimo completo por partner.

### No funcionales
- **Performance:** p95 API < 300 ms en lectura; p95 chat send/ack < 500 ms.
- **Escalabilidad:** horizontal en backend stateless + Redis para sesiones/eventos efímeros.
- **Disponibilidad:** objetivo 99.5% MVP, 99.9% fase 2.
- **Seguridad:** OWASP ASVS baseline, JWT + refresh rotatorio, cifrado en tránsito y reposo.
- **Privacidad:** minimización PII, retención diferenciada, borrado/exportación por usuario.
- **Observabilidad:** logs estructurados, trazas distribuidas, métricas de negocio y técnicas.

### Decisiones de producto con impacto técnico
- **Edad 18+:** validación DOB + aceptación de términos/consentimiento.
- **Verificación:** email + opcional selfie/documento para badge (fase 2).
- **Fotos:** moderación automática + cola manual.
- **Anonimato:** alias visible; email/teléfono nunca públicos.
- **Geolocalización:** almacenar geohash/point aproximado para matching; exactitud solo para features explícitas.

---

## B) Arquitectura (alto nivel → detalle)

### Diagrama textual de módulos
```text
[React Web]
  ├─ Auth UI / Onboarding / Swipe / Chat / Adopción / Partner Panel / Admin
  └─ API Client (REST + WebSocket)

[NestJS API - Modular Monolith]
  ├─ Auth / Users / Profiles / Matching / Chat / Media
  ├─ Reports / Blocks / Partners / Pets / Adoption
  ├─ Notifications / Admin / Audit
  └─ Infra adapters (Redis, S3, Email, Push, Queue)

[PostgreSQL]
  ├─ Core transactional schema
  ├─ PostGIS (distancia/geoconsultas)
  └─ pg_trgm (búsqueda difusa)

[Object Storage (S3 compatible)] -> fotos originales + thumbnails
[Redis] -> cache, rate limit, ws presence
[Queue (BullMQ)] -> thumbnails, notificaciones, moderación
[Providers] -> Email, Push, Antivirus opcional
```

### Enfoque recomendado
- **Modular Monolith en NestJS** para MVP:
  - Menor complejidad operativa.
  - Límites de módulo claros y eventos internos.
  - Posibilidad de extraer `Chat`/`Notifications` a microservicio luego.

### Multi-entorno
- Ambientes: `dev`, `staging`, `prod`.
- Config 12-factor por variables.
- Secrets en gestor (AWS Secrets Manager / Doppler / Vault).
- Migraciones automáticas en deploy con lock transaccional.

---

## C) Frontend (React + TypeScript)

### Estructura de proyecto
```text
src/
  app/            # router, providers globales
  modules/
    auth/
    onboarding/
    matching/
    chat/
    profile/
    adoption/
    partner/
    admin/
  components/     # UI reusable
  services/       # api clients, ws client
  store/          # estado global (auth, sesión, flags)
  hooks/
  utils/
  i18n/
```

### Routing y estado
- **Routing:** React Router con rutas públicas/privadas/roles.
- **State management:** Zustand o Redux Toolkit (auth + UI global).
- **Data fetching:** TanStack Query (cache, invalidaciones, reintentos).

### Pantallas MVP
- Onboarding (registro, DOB, consentimiento, intereses, fotos).
- Swipe/Matching (cards + filtros).
- Chat (lista conversaciones + sala en tiempo real).
- Perfil propio/ajeno.
- Reportes/Bloqueos.
- Adopción: listado, detalle mascota, solicitud.
- Panel partner: CRUD mascotas + pipeline solicitudes.

### Componentes clave
- `ProfileCard`, `SwipeDeck`, `DistanceFilter`, `ChatWindow`, `ReportModal`, `PetCard`, `ApplicationStepper`.
- Validación con Zod + React Hook Form.
- Manejo de error con boundary + toasts de fallback.
- Carga de imágenes por URL firmada + compresión cliente previa.
- UX anti-abuso: botones visibles de bloquear/reportar, confirmaciones y feedback.

### Rendimiento
- Virtualización en listas (conversations, adopciones).
- Lazy loading por ruta/módulo.
- Cache cliente con stale-while-revalidate.
- Pre-fetch de perfiles siguientes en swipe.

---

## D) Backend (NestJS)

### Módulos propuestos
- `AuthModule`, `UsersModule`, `ProfilesModule`, `MatchingModule`, `ChatModule`, `MediaModule`, `ReportsModule`, `PartnersModule`, `PetsModule`, `AdoptionModule`, `AdminModule`, `AuditModule`, `NotificationsModule`.

### Patrones
- `Controller -> Service -> Repository`.
- DTOs con `class-validator` + `ValidationPipe` global.
- Guards: `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard`.
- Interceptors para logging, response mapping, timeout.
- Filtros de excepción estandarizados (problem+json).

### AuthN/AuthZ
- Access JWT corto (15m) + Refresh rotatorio (7–30d).
- Revocación por blacklist en Redis + versionado de token en DB.
- RBAC: `USER`, `PARTNER`, `ADMIN`.
- Scopes finos (ej: `pets:write`, `adoption:review`).

### Chat en tiempo real
- WebSocket Gateway por namespace.
- Flujo: send -> persist -> publish -> ack cliente.
- Reintentos idempotentes con `clientMessageId`.
- Historial paginado por conversación.
- Rate limit por socket/user/IP.

---

## E) Modelo de datos (PostgreSQL)

### Tablas principales (resumen)
- `users(id, email, phone, password_hash, role, status, birth_date, created_at, deleted_at)`
- `profiles(user_id PK/FK, alias, bio, species_identity, interests[], visibility)`
- `preferences(user_id PK/FK, min_age, max_age, max_distance_km, species_filters[], gender_filters[])`
- `locations(user_id FK, point geography(Point,4326), geohash, updated_at)`
- `likes(id, from_user_id, to_user_id, created_at, UNIQUE(from_user_id,to_user_id))`
- `matches(id, user_a, user_b, status, matched_at, unmatched_at, UNIQUE(least(user_a,user_b), greatest(user_a,user_b)))`
- `conversations(id, match_id FK, created_at)`
- `messages(id, conversation_id, sender_id, body, media_id, sent_at, delivered_at, read_at, client_message_id UNIQUE)`
- `reports(id, reporter_id, target_user_id, reason, evidence_media_id, status, created_at)`
- `blocks(blocker_id, blocked_id, created_at, UNIQUE(blocker_id,blocked_id))`
- `partners(id, type, legal_name, tax_id, verification_status, created_at)`
- `partner_users(partner_id, user_id, role, UNIQUE(partner_id,user_id))`
- `pets(id, partner_id, name, species, breed, age_months, size, health_notes, status, location_point, created_at)`
- `adoption_applications(id, pet_id, applicant_user_id, status, form_jsonb, submitted_at, decided_at)`
- `adoption_events(id, application_id, type, payload_jsonb, created_by, created_at)`
- `audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_jsonb, created_at)`
- `media(id, owner_user_id, kind, storage_key, mime, width, height, moderation_status, created_at)`

### Índices y constraints
- Índices BTREE en FKs + timestamps de consulta frecuente.
- GIST en `locations.point` y `pets.location_point` (PostGIS).
- GIN `pg_trgm` en alias, nombre mascota, raza.
- CHECK en rangos de edad/distancia válidos.
- Soft delete en entidades sensibles.

### Geolocalización (PostGIS)
- Tipo `geography(Point,4326)` para distancia real en metros.
- Consulta típica usuarios cercanos:
```sql
SELECT u.id
FROM users u
JOIN locations l ON l.user_id = u.id
WHERE ST_DWithin(
  l.point,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  :radius_m
)
ORDER BY ST_Distance(l.point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
LIMIT :limit;
```

### State machines
- **Match:** `liked -> matched -> unmatched`.
- **Adopción:** `draft -> submitted -> screening -> interview|visit -> approved|rejected -> contract -> delivered -> closed` (+ `cancelled` desde estados intermedios con motivo obligatorio).

### Migraciones, seeds, backups
- Migraciones versionadas (Prisma/TypeORM migrations).
- Seeds solo datos base (roles, catálogos).
- Backups PITR diarios + snapshots cifrados; restore drill mensual.

---

## F) APIs (contratos listos)

### Convenciones
- Base: `/api/v1`
- Auth: `Bearer JWT`
- Error estándar:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "maxDistanceKm must be <= 300",
  "traceId": "..."
}
```

### Endpoints (MVP)
- **Auth**
  - `POST /auth/register` (public)
  - `POST /auth/login` (public)
  - `POST /auth/refresh` (public con refresh token)
  - `POST /auth/logout` (auth)
- **Profiles/Preferences**
  - `GET /me/profile` (auth)
  - `PUT /me/profile` (auth)
  - `PUT /me/preferences` (auth)
- **Matching**
  - `GET /matching/candidates?cursor=...&distanceKm=...` (auth)
  - `POST /matching/likes` body `{ "targetUserId": "uuid", "action": "like|pass" }`
  - `GET /matches` (auth)
  - `POST /matches/{id}/unmatch` (auth)
- **Chat**
  - `GET /conversations` (auth)
  - `GET /conversations/{id}/messages?cursor=...` (auth)
  - WS `chat:send`, `chat:ack`, `chat:typing`
- **Reports/Blocks**
  - `POST /reports`
  - `POST /blocks`
  - `DELETE /blocks/{blockedUserId}`
- **Pets/Adoption**
  - `GET /pets?species=&city=&status=`
  - `GET /pets/{id}`
  - `POST /pets` (partner)
  - `PATCH /pets/{id}` (partner)
  - `POST /adoption-applications` (user)
  - `GET /adoption-applications/me` (user)
  - `GET /partners/{partnerId}/applications` (partner)
  - `POST /adoption-applications/{id}/events` (partner)
- **Admin**
  - `GET /admin/reports`
  - `POST /admin/reports/{id}/resolve`

### Ejemplo request/response
```json
POST /api/v1/adoption-applications
{
  "petId": "9f...",
  "answers": {
    "housingType": "apartment",
    "hasOtherPets": true,
    "hoursAlonePerDay": 4
  }
}
```

```json
201 Created
{
  "id": "a1...",
  "status": "submitted",
  "submittedAt": "2026-01-10T15:01:02Z"
}
```

### Webhooks partners (opcional)
- `adoption.application.status_changed`
- Firma HMAC SHA-256 + reintentos exponenciales.
- Registro en `audit_logs` de emisión/resultado.

---

## G) Media, notificaciones y búsqueda

- **Media**
  - Flujo: pedir URL firmada -> upload directo storage -> callback de confirmación.
  - Procesamiento async: thumbnails + strip EXIF.
  - Antivirus opcional (ClamAV) en cola de escaneo.
- **Notificaciones**
  - Push: match nuevo, mensaje, cambio estado adopción.
  - Email transaccional: verificación, aprobaciones/rechazos, recordatorios.
- **Búsqueda/filtros**
  - `pg_trgm` para alias/raza/nombre difuso.
  - Paginación cursor-based estable (`created_at,id`).

---

## H) Trust & Safety + Privacidad

### Anti-acoso / anti-spam
- Rate limits por endpoint/socket.
- Cooldowns tras múltiples likes/mensajes en ráfaga.
- Detección de patrones (mensajes repetidos, links masivos).
- Shadowban opcional para reincidencia.

### Moderación
- Reportes con evidencia multimedia.
- Cola de revisión para admin/moderador.
- Flags automáticos por texto/foto sospechosa.

### Edad/consentimiento
- Gate 18+ obligatorio en onboarding.
- Consentimiento explícito de términos y privacidad versionados.
- Revalidación ante cambios de políticas.

### Protección de datos
- Clasificación: PII (email/teléfono), sensible (ubicación, preferencias).
- Minimización: solo campos necesarios por feature.
- Retención: mensajes 12–24 meses configurable; audit logs 24+ meses.
- Derechos: endpoint de exportación y borrado (soft + hard delete diferido).

### Colombia — Ley 1581/2012 checklist
- Consentimiento previo, expreso e informado.
- Finalidad clara del tratamiento en política.
- Canal para reclamos/consultas del titular.
- Procedimientos para actualización/rectificación/supresión.
- Encargados/proveedores con acuerdos de tratamiento de datos.

---

## I) DevOps y calidad

- **Dockerización**
  - `frontend` y `backend` con imágenes separadas.
  - `docker-compose` para local con Postgres + Redis + Mailhog.
- **CI/CD**
  - Pipeline: lint -> test -> build -> scan -> deploy.
  - Migraciones DB en etapa controlada (pre-deploy hook + rollback plan).
- **Testing**
  - Unit: servicios de dominio.
  - Integración: repositorios + Postgres real (testcontainers).
  - E2E: auth, matching, adopción y permisos.
  - Contratos: OpenAPI + validación de schemas.
  - Carga básica: k6 para matching feed/chat.
- **Observabilidad**
  - Logs JSON (pino/winston) con `traceId`.
  - Métricas Prometheus + dashboards Grafana.
  - Trazas OpenTelemetry.
  - Alertas: error rate, latencia p95, colas atrasadas.

---

## J) Plan de entrega (MVP 6–8 semanas)

### Hitos semanales sugeridos
- **Semana 1:** arquitectura base, auth, modelo datos inicial, CI/CD mínimo.
- **Semana 2:** perfiles/preferencias + feed de candidatos geográfico.
- **Semana 3:** likes/matches + bloqueos/reportes básicos.
- **Semana 4:** chat WS + historial + notificaciones base.
- **Semana 5:** módulo mascotas + panel partner inicial.
- **Semana 6:** solicitudes adopción + workflow estados + auditoría.
- **Semana 7:** hardening seguridad, moderación, observabilidad, performance.
- **Semana 8 (buffer):** QA final, fixes, documentación operativa, go-live.

### Estimación por módulo (S/M/L)
- Auth/Users: **M**
- Profiles/Matching: **L**
- Chat realtime: **L**
- Media: **M**
- Reports/Blocks/Safety: **M**
- Partners/Pets/Adoption: **L**
- Admin/Audit: **M**
- DevOps/Observabilidad: **M**

### Dependencias críticas y riesgos
- Riesgo de abuso/fraude en chat → mitigación: rate limit + moderación temprana.
- Riesgo de rendimiento en feed geográfico → mitigación: índices PostGIS + caché selectiva.
- Riesgo legal de datos personales → mitigación: privacy by design + checklist Ley 1581 desde sprint 1.

---

## Preguntas bloqueantes (máximo 3)
1. ¿Se requiere integración con proveedores locales de verificación de identidad en Colombia desde MVP?
2. ¿El panel partner necesita multi-sucursal desde lanzamiento o una sola sede por partner?
3. ¿Habrá monetización en MVP (suscripción/boost), o queda fuera del alcance inicial?
