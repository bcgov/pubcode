FROM mongo:6.0.5@sha256:9c8a0a019671ed7d402768d4df6dddcc898828e21e9f7b90a34b55fe8ca676ac
USER mongodb
COPY --chown=mongodb:mongodb mongod.conf /etc/mongo/
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
CMD ["mongod", "--config", "/etc/mongo/mongod.conf"]
