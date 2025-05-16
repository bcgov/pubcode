FROM node:22@sha256:e558507eb799e3a76fcdaaee5e48dce1a00aebc85892128a9fca59f63bd49511 AS build

WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && \
    npm run build

# Caddy
FROM caddy:2.10-alpine@sha256:e2e3a089760c453bc51c4e718342bd7032d6714f15b437db7121bfc2de2654a6

# Copy static files and config
COPY --from=build /app/dist /app/dist
COPY Caddyfile /etc/caddy/Caddyfile

# Packages and caddy format
RUN apk add --no-cache ca-certificates && \
    caddy fmt --overwrite /etc/caddy/Caddyfile

# Port, health check and non-root user
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3001/health
USER 1001