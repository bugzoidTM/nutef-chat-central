# ── Stage 1: build do frontend (Vite) ──
FROM node:22-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY index.html vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js components.json eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2: runtime — bridge Node (serve frontend + API whatsai + webhook) ──
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server ./server
COPY --from=frontend /build/dist ./dist
EXPOSE 3000
CMD ["node", "server/index.js"]
