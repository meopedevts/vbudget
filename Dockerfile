# ── Stage 1: Build the Solid+Vite frontend ───────────────────────────────────
FROM node:22-alpine AS frontend

WORKDIR /app/front

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY front/package.json front/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY front/ ./
RUN pnpm build
# Output: /app/front/dist


# ── Stage 2: Build the V backend (with frontend embedded) ────────────────────
FROM thevlang/vlang:latest AS backend

WORKDIR /app/back

COPY back/ ./

# Copy the frontend bundle into the embedded directory before compiling
COPY --from=frontend /app/front/dist ./src/embedded/

# thevlang/vlang is Alpine-based — default gcc already links against musl libc,
# so the binary runs natively on Alpine without any extra flags or packages.
RUN v src/ -o bin/vbudget


# ── Stage 3: Minimal Alpine runtime ──────────────────────────────────────────
FROM alpine:3

# sqlite-libs: V's db.sqlite module links dynamically against libsqlite3
RUN apk add --no-cache sqlite-libs

# Binary lives in /app — never on a volume
COPY --from=backend /app/back/bin/vbudget /app/vbudget

# Database is created relative to the working directory.
# Mount a volume at /data to persist vbudget.db across restarts.
WORKDIR /data

EXPOSE 8181

CMD ["/app/vbudget"]
