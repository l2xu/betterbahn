# Dockerfile
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stufe 1: Abhängigkeiten installieren
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Stufe 2: Die Anwendung bauen
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Stufe 3: Finale, produktive Stufe
FROM base AS runner
WORKDIR /app

# Set timezone to Europe/Berlin (German timezone)
ENV TZ=Europe/Berlin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


# Kopieren des Standalone-Outputs aus der Builder-Stufe
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Kopiert manuell das Modul, dessen Datendateien vom 'standalone'-Modus nicht erfasst werden.
COPY --from=builder /app/node_modules/.pnpm/db-hafas-stations@2.0.0 ./node_modules/.pnpm/db-hafas-stations@2.0.0

# Wechsel zum non-root 'node' Benutzer für erhöhte Sicherheit
USER node

# Expose port and add healthcheck
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]