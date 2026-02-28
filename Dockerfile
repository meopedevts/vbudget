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

RUN v src/ -o bin/vbudget


# ── Stage 3: Minimal runtime image ───────────────────────────────────────────
FROM debian:bookworm-slim

WORKDIR /app

# Just the binary — frontend is baked in, no volumes or env vars needed
COPY --from=backend /app/back/bin/vbudget ./vbudget

EXPOSE 8181

CMD ["./vbudget"]

