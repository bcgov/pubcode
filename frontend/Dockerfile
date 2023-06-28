FROM node:alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts
RUN npm run build

FROM caddy:2.6.4-alpine
WORKDIR /app
COPY --from=build /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist


HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3001/health || exit 1

RUN chmod 777 /usr/bin/caddy /config/caddy
RUN caddy fmt --overwrite /etc/caddy/Caddyfile
EXPOSE 3000
USER 1001
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
