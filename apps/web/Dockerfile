# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS build

WORKDIR /workspace

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json

RUN npm ci

COPY apps/web apps/web
COPY packages/api-contract packages/api-contract

RUN npm run build:web

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
RUN addgroup -S projectmt && adduser -S projectmt -G projectmt

COPY --from=build --chown=projectmt:projectmt /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=projectmt:projectmt /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=projectmt:projectmt /workspace/apps/web/public ./apps/web/public

USER projectmt

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "apps/web/server.js"]
