const mongoose = require("mongoose");
const logger = require("../logger");
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "default";
const DB_PWD = process.env.DB_PWD || "default";
const database = async () => {
  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(`mongodb://${DB_USER}:${DB_PWD}@${DB_HOST}:27017/pub-code?authSource=admin`);
    mongoose.connection.on("disconnected", () => {
      logger.error("disconnected from mongodb");
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("reconnected to mongodb");
    });
  } catch (error) {
    logger.error(error);
  }
};
module.exports = { database };
