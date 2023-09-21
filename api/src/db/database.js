const mongoose = require("mongoose");
const logger = require("../logger");
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "default";
const DB_PWD = process.env.DB_PWD || "default";
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || "pubcode";
const retry = require("async-retry");
const database = async () => {
  await retry(async () => {
    mongoose.set("strictQuery", false);
    const connectionUri = `mongodb://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    logger.info(`connecting to mongodb on url: ${connectionUri}`);
    await mongoose.connect(connectionUri, {
      authSource: "admin",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 60000 // Close sockets after 45 seconds of inactivity
    });
    mongoose.connection.on("disconnected", () => {
      logger.error("disconnected from mongodb");
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("reconnected to mongodb");
    });
  });

};
module.exports = { database };
