FROM node:22-slim

RUN apt-get update && apt-get install -y \
    build-essential libcairo2-dev libpango1.0-dev \
    libjpeg-dev libgif-dev librsvg2-dev python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && \
    npm install --no-save @napi-rs/canvas-linux-x64-gnu

COPY . .
RUN chown -R node:node /app
USER node
CMD ["node", "index.js"]
