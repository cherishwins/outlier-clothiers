# Outlier Clothiers, as one image with two runnable targets.
#
#   runner   the Next.js server (default). node server.js on :3000.
#   migrate  one-shot: `prisma migrate deploy` against DATABASE_URL, then exits.
#
# NEXT_PUBLIC_* values are inlined into the bundle at BUILD time, server code
# included, so they are build args, not runtime env. They are non-secret
# (app URL, testnet flag) and default to safe values so the image builds with
# nothing supplied. Secrets — DATABASE_URL, X402_PAYMENT_ADDRESS, the CDP and
# Telegram keys — are RUNTIME env only and never enter an image layer.

# Base images are pinned by digest, not by the floating :22-bookworm(-slim) and
# :16-alpine tags, so a rebuild always resolves the exact same bytes. This also
# keeps the libssl ABI coupling below honest: the full-Debian source of
# libssl.so.3 and the slim runtime base MUST be the same node release, or the
# lifted library can drift from the loader that dlopen's it. Both digests below
# are node v22.23.3 on Debian bookworm (12.15). Bump these deliberately (e.g.
# Renovate/Dependabot), always as a matched pair, never on an incidental rebuild.
#   node:22-bookworm       -> sha256:363e1587...fad7  (libssl source)
#   node:22-bookworm-slim  -> sha256:43ac6c60...772c  (deps / runner)
#   postgres:16-alpine     -> pinned in docker-compose.prod.yml
#
# The Prisma query and schema engines are the debian-openssl-3.0.x builds and
# link libssl.so.3 / libcrypto.so.3, which the -slim base does not ship. Rather
# than pull the whole openssl package, lift just those two libraries from the
# full Debian image (same bookworm, exact ABI match, ~5 MB) into the runtime
# stages. Keeps the runner slim and needs no OS package network.
FROM node:22-bookworm@sha256:363e1587494626837fa7f9a23bdb453d13b0ff3c67c705c2805cfc69c2d2fad7 AS libssl
# (only used as a source of /usr/lib/x86_64-linux-gnu/libssl.so.3 + libcrypto.so.3)

FROM node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS deps
WORKDIR /app
# libssl must be present BEFORE the install so Prisma's platform detection sees
# OpenSSL 3.0 and resolves the "native" engine to debian-openssl-3.0.x. Without
# it, a slim image misdetects as 1.1.x and generates an engine the runtime
# cannot load. Copied here, it flows through to source, build and migrate.
COPY --from=libssl /usr/lib/x86_64-linux-gnu/libssl.so.3 /usr/lib/x86_64-linux-gnu/libcrypto.so.3 /usr/lib/x86_64-linux-gnu/
# The x402 rail is a vendored tarball referenced by package-lock.json, so it
# must be present before the install resolves.
COPY package.json package-lock.json ./
COPY vendor/ vendor/
RUN npm ci --no-audit --no-fund

FROM deps AS source
COPY . .

FROM source AS build
# Public, non-secret, inlined at build. Empty/localhost defaults keep the
# image buildable with no arguments.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_TESTNET=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_TESTNET=$NEXT_PUBLIC_TESTNET \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=4096
# Generate the Prisma client (schema is only present now that source is in),
# then build the self-contained server.
RUN npx prisma generate && npm run build

# One-shot migration job. Reuses the full dependency tree (Prisma CLI) plus the
# schema and the baseline migration in prisma/migrations. Runs, and must exit 0,
# before web starts.
FROM source AS migrate
# libssl is inherited from deps; the Prisma schema engine links it too.
ENV NODE_ENV=production
# Drop root: this is the one container that holds DATABASE_URL and has write DDL
# access, so it must not run as uid 0. `prisma migrate deploy` only reads the
# world-readable schema/migrations copied by `COPY . .` and connects to the DB
# as an unprivileged process — no in-container write is needed. Matches runner.
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS runner
WORKDIR /app
COPY --from=libssl /usr/lib/x86_64-linux-gnu/libssl.so.3 /usr/lib/x86_64-linux-gnu/libcrypto.so.3 /usr/lib/x86_64-linux-gnu/
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# The standalone bundle, its static assets, and public/. The generated Prisma
# client and its query engine are force-copied so a runtime that Next's file
# tracer may not have carried the engine binary into still has it.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=25s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
