# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=development
RUN pnpm install --no-frozen-lockfile
# Generate Prisma client and build packages
RUN pnpm --filter @cie/api prisma:generate
RUN pnpm --filter @cie/shared... --filter @cie/api build

FROM base AS runner
WORKDIR /app
ENV PORT=4000
EXPOSE 4000
COPY --from=build /app /app
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]

