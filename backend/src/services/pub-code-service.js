"use strict";
const logger = require("../logger");
const pubcodeEntity = require("../entities/pub-code-entity");
/**
 * The below method will be called from the router after validating the x-api-key in the router layer.
 * it will take the request body and parse it into a json object array. it is expected that the request body is a json array of objects.
 * the json array of objects will be validated against the schema and then inserted into the database.
 * it will delete and add all these new in a single transaction into mongoDB.
 */

const bulkLoad = async (req, res) => {
  try {
    const notInsertedArray = [];
    const payload = req.body;
    if (payload && Array.isArray(payload) && payload.length > 0) {
      for (const pubcode of payload) {
        const foundEntity = await pubcodeEntity.findOneAndReplace({ repo_name: pubcode.repo_name }, pubcode).exec();
        if (!foundEntity) {
          notInsertedArray.push(pubcode);
        }
      }
      if (notInsertedArray.length > 0) {
        await pubcodeEntity.insertMany(notInsertedArray);
      }
      res.status(200).json({ });
    } else {
      res.status(400).json({ message: "Invalid request body" });
    }

  } catch (error) {
    logger.error("bulkLoad: ", error);
    res.status(500).json(error);
  }
};
const readAll = async (req, res) => {
  try {
    const result = await pubcodeEntity.find({});
    res.status(200).json(result);
  } catch (error) {
    logger.error("readAll: ", error);
    res.status(500).json(error);
  }
};

const findById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pubcodeEntity.findById(id).exec();
    res.status(200).json(result);
  } catch (error) {
    logger.error("findById: ", error);
    res.status(500).json(error);
  }
};
const health = async (req, res) => {
  try {
    const result = await pubcodeEntity.countDocuments();
    res.status(200).json(result);
  } catch (error) {
    logger.error("health: ", error);
    res.status(500).json(error);
  }
}
module.exports = {
  bulkLoad,
  readAll,
  findById,
  health
};
