FROM node:alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts
RUN npm run build

FROM caddy:2.6.4-alpine AS caddy-build
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=build /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

RUN caddy fmt --overwrite /etc/caddy/Caddyfile


FROM scratch
COPY --from=caddy-build / /
EXPOSE 3000
USER 1001
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
