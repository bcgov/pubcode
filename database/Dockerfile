FROM ghcr.io/bcgov/nr-containers/mongo:6.0.11@sha256:46d4c8db37f2a58f75b20738ac70f70a213032cdee6bcc018c400954af424cbe

# Boilerplate to keep scanners happy (covered in FROM image)
HEALTHCHECK CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
USER mongodb
