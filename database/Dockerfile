FROM mongo:6.0.7
USER mongodb
COPY --chown=mongodb:mongodb mongod.conf /etc/mongo/
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
CMD ["mongod", "--config", "/etc/mongo/mongod.conf"]
