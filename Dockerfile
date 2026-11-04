# Uso: docker build --target api . (ou worker, ou migrate)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/prisma.config.ts packages/db/
COPY packages/db/prisma packages/db/prisma
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
RUN npm ci
COPY packages packages
COPY apps apps
RUN npm run build

# Traz o CLI do Prisma, que é dependência de desenvolvimento, para aplicar as migrações.
FROM build AS migrate
WORKDIR /app/packages/db
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM build AS pruned
RUN npm prune --omit=dev

FROM node:22-slim AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruned /app /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]

FROM node:22-slim AS worker
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruned /app /app
USER node
CMD ["node", "apps/worker/dist/worker.js"]
