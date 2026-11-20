# Uso: docker build --target api . (ou worker, web ou migrate)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/prisma.config.ts packages/db/
COPY packages/db/prisma packages/db/prisma
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY packages packages
COPY apps apps
# O Next grava o destino de /api no build; em produção quem encaminha é o Nginx.
ENV API_INTERNAL_URL=http://api:3000 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Traz o CLI do Prisma, que é dependência de desenvolvimento, para aplicar as migrações.
FROM build AS migrate
WORKDIR /app/packages/db
USER node
CMD ["sh", "scripts/migrar.sh"]

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

# O modo standalone do Next já traz só as dependências que o servidor usa.
FROM node:22-slim AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]