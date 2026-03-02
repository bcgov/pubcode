FROM ghcr.io/bcgov/nr-containers/mongo:7.0.30

# Boilerplate to keep scanners happy (covered in FROM image)
HEALTHCHECK CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
USER mongodb
