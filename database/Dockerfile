FROM mongo:6.0.4@sha256:2374c2525c598566cc4e62145ba65aecfe1bd3bf090cccce1ca44f3e2b60f861
USER mongodb
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD ["mongosh", "--eval", "db.adminCommand('ping')"]
