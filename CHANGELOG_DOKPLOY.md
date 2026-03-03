# Changelog - Migración a Dokploy

## [2026-01-08] - Configuración Dokploy

### Añadido
- **`Dockerfile`** - Creado desde cero (no existía anteriormente)
  - Base: `node:20-alpine`
  - Build: TypeScript → JavaScript con `npm run build`
  - Puerto: 3001
  - Health check: Endpoint `/health` verificado cada 30s
  - Optimizado: Solo dependencias de producción

- **`docker-compose.yml`** compatible con Dokploy
  - Red `dokploy-network` externa
  - Labels Traefik para dominio `api.thecookflow.com`
  - Puerto 3001 expuesto
  - Servicio PostgreSQL 16 incluido
  - Volumen persistente para base de datos

- **`.env.example`** actualizado con:
  - `DATABASE_URL` - Conexión a PostgreSQL
  - `POSTGRES_PASSWORD` - Contraseña de base de datos
  - `JWT_SECRET` - Secret para autenticación JWT
  - `BCRYPT_ROUNDS` - Rounds para hashing de contraseñas
  - `PORT` - Puerto del servidor (3001)
  - `NODE_ENV` - Entorno de ejecución
  - `ALLOWED_ORIGINS` - CORS origins permitidos
  - `SKINCHEF_URL` - URL del servicio AI

### Modificado
- Ninguno (archivos nuevos)

### Notas
- **Stack**: Node.js 20 + Express + TypeScript + Drizzle ORM
- **Puerto interno**: 3001
- **Dominio objetivo**: api.thecookflow.com
- **Base de datos**: PostgreSQL 16 Alpine
- **Seguridad**: Helmet + CORS + Rate Limiting + bcrypt + JWT
- **Dependencias**:
  - `tcf-skinchef` (servicio AI)
  - `postgres` (base de datos)

### Compatibilidad Dokploy
- ✅ Sin `container_name`
- ✅ Red externa `dokploy-network`
- ✅ Labels Traefik correctos
- ✅ Health check implementado
- ✅ Volumen persistente para PostgreSQL
- ✅ Variables de entorno documentadas

### Health Check Endpoint
El Dockerfile incluye un health check que verifica el endpoint `/health` cada 30 segundos.

**Asegúrate de que tu API Express tenga este endpoint:**

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```
