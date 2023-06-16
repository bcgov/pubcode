FROM node:18-bullseye-slim AS builder
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY ./src ./src

# Deployment container
# Deployment container
FROM gcr.io/distroless/nodejs:18
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
CMD ["--max-old-space-size=100", "src/server"]
