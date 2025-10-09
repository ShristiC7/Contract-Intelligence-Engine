<<'PATCH'
*** Begin Patch
*** Update File: apps/api/Dockerfile
@@
-FROM base AS build
+FROM base AS build
 WORKDIR /app
 COPY . .
-RUN pnpm install --no-frozen-lockfile
-RUN pnpm --filter @cie/shared... --filter @cie/api build
+ENV NODE_ENV=development
+RUN pnpm install --no-frozen-lockfile
+# Generate Prisma client and build packages
+RUN pnpm --filter @cie/api prisma:generate
+RUN pnpm --filter @cie/shared... --filter @cie/api build
*** End Patch
PATCHR /app/apps/api
CMD ["node", "dist/index.js"]

