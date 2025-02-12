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
    const connectionUri = `mongodb://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    logger.info(`connecting to mongodb on url: ${connectionUri}`);
    await mongoose.connect(connectionUri, {
      authSource: "admin",
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 60000
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
