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

# Add CAP_NET_BIND_SERVICE capability
RUN apk add --no-cache libcap && setcap 'cap_net_bind_service=+ep' /usr/bin/caddy

EXPOSE 3000
USER 1001
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
