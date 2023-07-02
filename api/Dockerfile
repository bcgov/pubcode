FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY ./src ./src

# Deployment container
# Deployment container
FROM gcr.io/distroless/nodejs20:nonroot
ENV NODE_ENV production

# Copy over app
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port - mostly a convention, for readability
EXPOSE 3000

USER 1001

# Start up command
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000
CMD ["--max-old-space-size=100", "src/server"]
