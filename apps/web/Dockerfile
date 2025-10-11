# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @cie/web build

FROM base AS runner
WORKDIR /app
ENV PORT=3000
EXPOSE 3000
# For simplicity, copy the built repo and run the web app
COPY --from=build /app /app
WORKDIR /app/apps/web
CMD ["pnpm", "start"]

