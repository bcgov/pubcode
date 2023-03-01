FROM mongo:6.0.3@sha256:db616c3ceb0a82837d8ad6382ee93aff4fae89f9b7ad37b3e6c07f35f1559345
USER mongodb
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
