# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle

RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

USER nodejs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
