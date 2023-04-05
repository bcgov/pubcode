FROM mongo:6.0.4@sha256:a4f2db6f54aeabba562cd07e5cb758b55d6192dcc6f36322a334ba0b0120aaf1
USER mongodb
COPY --chown=mongodb:mongodb mongod.conf /etc/mongo/
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
CMD ["mongod", "--config", "/etc/mongo/mongod.conf"]
