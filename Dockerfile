COPY --from=backend /app/back/bin/vbudget /app/vbudget
COPY --from=frontend /app/front/dist ./src/embedded/
COPY back/ ./
WORKDIR /app/frontend
# Output: /app/front/dist
COPY front/ ./
COPY front/package.json front/pnpm-lock.yaml ./
# ── Stage 1: Build the Solid+Vite frontend ───────────────────────────────────
COPY frontend/package.json frontend/pnpm-lock.yaml ./

WORKDIR /app/front
COPY frontend/ ./
# Install pnpm
# Output: /app/frontend/dist

COPY front/package.json front/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY front/ ./
WORKDIR /app/backend
# Output: /app/front/dist
COPY backend/ ./

# ── Stage 2: Build the V backend (with frontend embedded) ────────────────────
COPY --from=frontend /app/frontend/dist ./src/embedded/

WORKDIR /app/back

COPY back/ ./

# Copy the frontend bundle into the embedded directory before compiling
COPY --from=frontend /app/front/dist ./src/embedded/

# thevlang/vlang is Alpine-based — default gcc already links against musl libc,
# so the binary runs natively on Alpine without any extra flags or packages.
RUN v src/ -o bin/vbudget


COPY --from=backend /app/backend/bin/vbudget /app/vbudget
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
