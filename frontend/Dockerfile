FROM node:alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --legacy-peer-deps ;\
    npm run build

FROM caddy:2.6.4-alpine@sha256:8b47a88bd36bc9fe75bff823017438cb43d94abe13f638363517e5feeb45a7c6
WORKDIR /app
COPY --from=build /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

EXPOSE 3000
USER 1001
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000
