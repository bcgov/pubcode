FROM node:22@sha256:a9316925500a0ceef7510f5587cd7147a969cc5c41d0cce2c11affaf65a57ae0 AS build
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts

# Deployment container
FROM gcr.io/distroless/nodejs22:nonroot@sha256:7461370c8473cfcbf5def249423d5e8301b0e6b98cb256b3c8707f0201c2ea4a
ENV NODE_ENV production

# Copy over app
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY ./src ./src

# Expose port - mostly a convention, for readability
EXPOSE 3000

USER 1001

# Start up command
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000
CMD ["--max-old-space-size=100", "src/server"]
