# Dockerfile

# Stufe 1: Abhängigkeiten installieren
# Wechsel zu einem Debian-basierten Image (node:18) für bessere Kompatibilität.
FROM node:18 AS deps
WORKDIR /app

# Verhindert, dass Puppeteer beim Installieren Chromium herunterlädt.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
# Führt npm install aus, ohne den Browser herunterzuladen
RUN npm install

# Stufe 2: Die Anwendung bauen
FROM node:18 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Erneut setzen, um sicherzugehen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stufe 3: Finale, produktive Stufe
FROM node:18 AS runner
WORKDIR /app

# Set timezone to Europe/Berlin (German timezone)
ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ---- HINZUGEFÜGT FÜR PUPPETEER (Chromium + Dependencies Methode) ----
# Installiert Chromium und alle notwendigen Abhängigkeiten direkt aus den Debian-Repositories.
# Dies ist die stabilste Methode und wird vom Puppeteer-Team empfohlen.
RUN apt-get update \
    && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    chromium \
    tzdata \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
# ---- ENDE PUPPETEER-ZUSATZ ----

ENV NODE_ENV=production
ENV USE_CHROMIUM_PATH=true
ENV NEXT_TELEMETRY_DISABLED=1


# Kopieren des Standalone-Outputs aus der Builder-Stufe
# Anpassen des Besitzers an den Standard 'node' Benutzer
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# ---- HINZUGEFÜGT FÜR db-hafas-stations ----
# Kopiert manuell das Modul, dessen Datendateien vom 'standalone'-Modus nicht erfasst werden.
COPY --from=builder --chown=node:node /app/node_modules/db-hafas-stations ./node_modules/db-hafas-stations
# ---- ENDE db-hafas-stations-ZUSATZ ----

# ---- PRÄVENTIVE LÖSUNG FÜR FEHLENDE DATEIEN ----
# HINWEIS: Dieser Ansatz löst Probleme mit fehlenden Dateien (wie .json, .sql etc.),
# führt aber zu einem DEUTLICH GRÖSSEREN Docker-Image, da der Vorteil von 'output: standalone'
# teilweise aufgehoben wird. Dies stellt sicher, dass alle Pakete vollständig sind.
# COPY --from=builder --chown=node:node /app/node_modules ./node_modules
# ---- ENDE PRÄVENTIVE LÖSUNG ----

# Wechsel zum non-root 'node' Benutzer für erhöhte Sicherheit
USER node

EXPOSE 3000
CMD ["node", "server.js"]