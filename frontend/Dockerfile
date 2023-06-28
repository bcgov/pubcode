FROM node:alpine AS build

WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && \
    npm run build

FROM caddy:2.7-alpine


WORKDIR /app
COPY --from=build /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

RUN apk add --no-cache ca-certificates && \
    caddy fmt --overwrite /etc/caddy/Caddyfile

HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3001/health || exit 1
EXPOSE 3000 3001
USER 1001
