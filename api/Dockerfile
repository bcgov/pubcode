FROM node:22@sha256:0b5b940c21ab03353de9042f9166c75bcfc53c4cd0508c7fd88576646adbf875 AS build
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts

# Deployment container
FROM gcr.io/distroless/nodejs22:nonroot@sha256:581893ba58980f0b4c7444d7a16b89f4e966cd89a89f3e0c6f26c482e312f008
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
