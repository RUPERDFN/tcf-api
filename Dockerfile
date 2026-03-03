# Stage 1: Build (instala todas las deps incluido TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production (solo deps de producción)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3001

# Health check (uses /ping which is instant, no DB/external deps)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando de inicio
CMD ["node", "dist/src/index.js"]
