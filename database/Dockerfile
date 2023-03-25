FROM mongo:6.0.4@sha256:a4f2db6f54aeabba562cd07e5cb758b55d6192dcc6f36322a334ba0b0120aaf1
USER mongodb
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
