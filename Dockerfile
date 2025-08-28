# Dockerfile

# Stufe 1: Abhängigkeiten installieren
FROM node:24-alpine AS deps
WORKDIR /app

# Verhindert, dass Puppeteer beim Installieren Chromium herunterlädt.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
# Führt npm install aus, ohne den Browser herunterzuladen
RUN npm install

# Stufe 2: Die Anwendung bauen
FROM node:24-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Erneut setzen, um sicherzugehen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stufe 3: Finale, produktive Stufe
FROM node:24-alpine AS runner
WORKDIR /app

# Set timezone to Europe/Berlin (German timezone)
ENV TZ=Europe/Berlin
RUN apk add --no-cache \
    curl \
    ca-certificates \
    font-liberation \
    alsa-lib \
    libatk-1.0 \
    libatk-bridge-2.0 \
    glib \
    dbus-libs \
    expat \
    fontconfig \
    mesa-gbm \
    libgcc \
    libstdc++ \
    gtk+3.0 \
    nspr \
    nss \
    pango \
    cairo \
    cups-libs \
    libx11 \
    libxcb \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxext \
    libxfixes \
    libxi \
    libxrandr \
    libxrender \
    libxscrnsaver \
    libxtst \
    xdg-utils \
    wget \
    chromium \
    tzdata && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV USE_CHROMIUM_PATH=true
ENV NEXT_TELEMETRY_DISABLED=1


# Kopieren des Standalone-Outputs aus der Builder-Stufe
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Kopiert manuell das Modul, dessen Datendateien vom 'standalone'-Modus nicht erfasst werden.
COPY --from=builder /app/node_modules/db-hafas-stations ./node_modules/db-hafas-stations

# Wechsel zum non-root 'node' Benutzer für erhöhte Sicherheit
USER node

# Expose port and add healthcheck
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]
