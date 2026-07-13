FROM node:22-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* e inlined no bundle e o rewrite /api (next.config.js) e
# serializado no build — precisam existir AQUI, nao so em runtime.
# O Render passa as env vars do painel como build args, mas o Dockerfile
# precisa declara-las com ARG para que chequem ao `npm run build`.
ARG COMMUNITY_API_URL
ARG NEXT_PUBLIC_COMMUNITY_API_URL
ARG NEXT_PUBLIC_COMMUNITY_URL
ENV COMMUNITY_API_URL=$COMMUNITY_API_URL \
    NEXT_PUBLIC_COMMUNITY_API_URL=$NEXT_PUBLIC_COMMUNITY_API_URL \
    NEXT_PUBLIC_COMMUNITY_URL=$NEXT_PUBLIC_COMMUNITY_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
