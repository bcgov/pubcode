"use strict";
const http = require("http");
const log = require("./logger");
const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");
const { database } = require("./db/database");
const port = normalizePort(process.env.PORT || 3000);
const cacheService = require("./services/cache-service");
app.set("port", port);
const server = http.createServer(app);
database().then(() => {
  log.info("mongoose initialized");
  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);
  cacheService.loadAllPubCodes().then(() => {
    log.info("pub codes loaded to cache");
  }).catch((error) => {
    log.error(error);
  });
}).catch((error) => {
  log.error(error);
  process.exit(1);
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const portNumber = parseInt(val, 10);

  if (isNaN(portNumber)) {
    // named pipe
    return val;
  }

  if (portNumber >= 0) {
    // port number
    return portNumber;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ?
    "Pipe " + port :
    "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      log.error(bind + " requires elevated privileges");
      break;
    case "EADDRINUSE":
      log.error(bind + " is already in use");
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ?
    "pipe " + addr :
    "port " + addr.port;
  log.info("Listening on " + bind);
}

process.on("SIGINT", () => {
  server.close(() => {
    log.info("process terminated");
    process.exit(0);
  });
});
process.on("SIGTERM", () => {
  server.close(() => {
    log.info("process terminated");
    process.exit(0);
  });
});
