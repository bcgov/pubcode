FROM registry.access.redhat.com/ubi8/ubi:8.7-1090@sha256:70fc843d4eb70159799e065d2830726b884c93950f8891e263d6328af6141173 AS builder
RUN dnf module install -y nodejs:18

WORKDIR /app
COPY . ./
RUN npm ci --omit=dev

# Deployment container
FROM node:lts-alpine@sha256:ffc770cdc09c9e83cccd99d663bb6ed56cfaa1bab94baf1b12b626aebeca9c10

# Set node to production
ENV NODE_ENV production

# Copy over app
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port - mostly a convention, for readability
EXPOSE 3000

# Non-privileged user
RUN adduser -D app
USER app

# Start up command
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000
ENTRYPOINT ["node", "src/server"]
