# TCF API - TheCookFlow Backend

A production-ready REST API for TheCookFlow meal planning application. Features JWT authentication, AI-powered menu generation, shopping list management with PDF export, and a gamification system.

## Stack Tecnológico

- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **AI Service**: SkinChef integration for menu generation
- **Export**: PDFKit for shopping list PDF generation

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/USUARIO/tcf-api.git
cd tcf-api

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Crear tablas en la base de datos
npm run db:push

# Iniciar en desarrollo
npm run dev
```

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Sí |
| `JWT_SECRET` | Secret para firmar tokens JWT | Sí |
| `PORT` | Puerto del servidor (default: 5000) | No |
| `NODE_ENV` | Entorno (development/production) | No |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | No |
| `SKINCHEF_URL` | URL del servicio SkinChef AI | No |
| `SMTP_HOST` | Host del servidor SMTP | No |
| `SMTP_PORT` | Puerto SMTP | No |
| `SMTP_USER` | Usuario SMTP | No |
| `SMTP_PASS` | Contraseña SMTP | No |

## Comandos Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Ejecutar tests
npm test

# Push schema a base de datos
npm run db:push

# Generar migraciones
npm run db:generate
```

## Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/forgot-password` - Solicitar reset de contraseña
- `POST /api/auth/reset-password` - Resetear contraseña
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `PUT /api/users/preferences` - Actualizar preferencias dietéticas

### Menús
- `POST /api/menus/generate` - Generar menú semanal con IA
- `GET /api/menus/current` - Menú activo
- `GET /api/menus/history` - Historial de menús
- `POST /api/menus/:menuId/swap` - Intercambiar comida
- `POST /api/menus/:menuId/complete-meal` - Marcar comida completada
- `GET /api/menus/:menuId/recipe/:dayIndex/:mealType` - Obtener receta
- `DELETE /api/menus/:menuId` - Eliminar menú

### Shopping
- `GET /api/shopping/current` - Lista de compras actual
- `POST /api/shopping/items` - Añadir item
- `PUT /api/shopping/items/:itemId/toggle` - Marcar comprado/pendiente
- `DELETE /api/shopping/items/:itemId` - Eliminar item
- `POST /api/shopping/substitution` - Obtener sustitutos de ingrediente
- `GET /api/shopping/export/pdf` - Exportar lista en PDF
- `GET /api/shopping/export/text` - Exportar lista en texto

### Gamification
- `GET /api/gamification/stats` - Estadísticas del usuario
- `GET /api/gamification/badges` - Badges disponibles y obtenidos
- `GET /api/gamification/leaderboard` - Tabla de líderes
- `POST /api/gamification/claim-badge/:badgeId` - Reclamar badge

### Health
- `GET /health` - Estado del servidor y servicios

## Docker

```bash
# Build imagen
docker build -t tcf-api .

# Ejecutar contenedor
docker run -p 5000:5000 --env-file .env tcf-api
```

## Seguridad

- Passwords hasheados con bcrypt
- JWT tokens con expiración de 7 días
- Rate limiting: 100 req/15min (prod), 1000 req/15min (dev)
- Headers de seguridad con Helmet
- CORS configurable por entorno
- Validación de inputs con Zod

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.
