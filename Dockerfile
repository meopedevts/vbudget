# ── Stage 1: Build the Solid+Vite frontend ───────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy frontend source and build
COPY frontend/ ./
RUN pnpm run build

# Output: /app/frontend/dist

# ── Stage 2: Build the V backend (with frontend embedded) ────────────────────
FROM thevlang/vlang:latest AS backend

WORKDIR /app/backend

# Copy backend source
COPY backend/ ./

# Copy the frontend bundle into the embedded directory before compiling
COPY --from=frontend /app/frontend/dist ./src/embedded/

# thevlang/vlang is Alpine-based — default gcc already links against musl libc,
# so the binary runs natively on Alpine without any extra flags or packages.
RUN v src/ -o bin/vbudget

# Output: /app/backend/bin/vbudget

# ── Stage 3: Final runtime image ──────────────────────────────────────────────
FROM alpine:3

# sqlite-libs: V's db.sqlite module links dynamically against libsqlite3
RUN apk add --no-cache sqlite-libs

# Binary lives in /app — never on a volume
COPY --from=backend /app/backend/bin/vbudget /app/vbudget

# Database is created relative to the working directory.
# Mount a volume at /data to persist vbudget.db across restarts.
WORKDIR /data

EXPOSE 8181

CMD ["/app/vbudget"]
