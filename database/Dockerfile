FROM ghcr.io/bcgov/nr-containers/mongo:6.0.11

# Boilerplate to keep scanners happy (covered in FROM image)
HEALTHCHECK CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
USER mongodb
