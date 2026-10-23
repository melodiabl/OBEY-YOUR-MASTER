FROM node:22-slim AS frontend
WORKDIR /web
COPY dashboard/frontend/package*.json ./
RUN npm ci --ignore-scripts --no-fund
COPY dashboard/frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y \
    build-essential pkg-config libcairo2-dev libpango1.0-dev \
    libjpeg-dev libgif-dev librsvg2-dev python3 util-linux \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
COPY --from=frontend /web/out ./dashboard/frontend/out
RUN chown -R node:node /app
USER node
CMD ["node", "index.js"]
