FROM node:22@sha256:6e62aab5da3680c65b90b213bb5c9768fd745fafecf8687e87a4728c99e5c1d2 AS build
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts

# Deployment container
FROM gcr.io/distroless/nodejs22:nonroot@sha256:595dcd85af33b16450868993ec48992c82d90a692fb0d5c6f435bca16edb85d6
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
