FROM node:alpine as build
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
FROM caddy:2.4.6-alpine as deploy
WORKDIR /app
ARG DEPENDENCY=/app
EXPOSE 3000
COPY --from=build ${DEPENDENCY}/Caddyfile /etc/caddy/Caddyfile
COPY --from=build ${DEPENDENCY}/dist /app/dist
USER 1001
