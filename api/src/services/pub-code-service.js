"use strict";
const logger = require("../logger");
const pubcodeEntity = require("../entities/pub-code-entity");
const cacheService = require("../services/cache-service");
const emailService = require("../email");
const EMAIL_RECIPIENTS = process.env.EMAIL_RECIPIENTS?.split(",");

/**
 * The below method will be called from the router after validating the x-api-key in the router layer.
 * it will take the request body and parse it into a json object array. it is expected that the request body is a json array of objects.
 * the json array of objects will be validated against the schema and then inserted into the database.
 * it will delete and add all these new in a single transaction into mongoDB.
 */
async function insertOrUpdate(payload, notInsertedArray) {
  let repoWithErrors = [];
  for (const pubcode of payload) {
    const entity = new pubcodeEntity({ ...pubcode });
    const errors = entity.validateSync();
    if (errors) {
      console.info(`insertOrUpdate: ${pubcode.repo_name} is not valid`);
      logger.error("insertOrUpdate: ", errors);
      repoWithErrors.push(pubcode.repo_name);
      continue;
    }
    const foundEntity = await pubcodeEntity.findOneAndReplace({ repo_name: pubcode.repo_name }, pubcode).exec();
    if (!foundEntity) {
      notInsertedArray.push(pubcode);
    }
  }
  if (notInsertedArray.length > 0) {
    await pubcodeEntity.insertMany(notInsertedArray);
  }
  if (repoWithErrors?.length > 0 && EMAIL_RECIPIENTS) {
    try {
      const email = emailService.generateHtmlEmail("Error During Bulk Load of Pub Codes Some Repo Contains are not valid.", EMAIL_RECIPIENTS, "Error During Bulk Load of Pub Codes Some Repo Contains are not valid.", `<p>${repoWithErrors.join(",")}</p>`);
      await emailService.send(email);
    } catch (e) {
      logger.error("bulkLoad: ", e);
    }
  }
}

async function sendEmailForError(error) {
  if (EMAIL_RECIPIENTS) {
    try {
      const email = emailService.generateHtmlEmail("Error During Bulk Load of Pub Codes Saving to Database Failed", EMAIL_RECIPIENTS, "Error During Bulk Load of Pub Codes Saving to Database Failed.", `<p>${error.message}</p>`);
      await emailService.send(email);
    } catch (e) {
      logger.error("bulkLoad: ", e);
    }
  }
}

const bulkLoad = async (req, res) => {
  try {
    const notInsertedArray = [];
    const payload = req.body;
    if (payload && Array.isArray(payload) && payload.length > 0) {
      insertOrUpdate(payload, notInsertedArray).catch(async (error) => {
        await sendEmailForError(error);
        logger.error("bulkLoad: ", error);
      });
      res.status(200).json({});
    } else {
      res.status(400).json({ message: "Invalid request body" });
    }

  } catch (error) {
    logger.error("bulkLoad: ", error);
    if (EMAIL_RECIPIENTS) {
      try {
        const email = emailService.generateHtmlEmail("Error During Bulk Load of Pub Codes", EMAIL_RECIPIENTS, "Error During Bulk Load of Pub Codes", error.message);
        await emailService.send(email);
      } catch (e) {
        logger.error("bulkLoad: ", e);
      }
    }

    res.status(500).json(error);
  }
};
const readAll = async (req, res) => {
  try {
    res.status(200).json(cacheService.getAllPubCodes());
  } catch (error) {
    logger.error("readAll: ", error);
    if (EMAIL_RECIPIENTS) {
      try {
        const email = emailService.generateHtmlEmail("Error During Read ALl of Pub Codes", EMAIL_RECIPIENTS, "Error During Read ALl of Pub Codes", error.message);
        await emailService.send(email);
      } catch (e) {
        logger.error("bulkLoad: ", e);
      }
    }
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
};
const softDeleteRepo = async (req, res) => {
  try {
    let pubcodeEntityFromDB = await pubcodeEntity.findOne({ repo_name: req.params.repo_name }).exec();
    if (!pubcodeEntityFromDB) {
      res.status(404).json({ message: "Repo Not Found" });
    } else {
      await pubcodeEntity.updateOne({ _id: pubcodeEntityFromDB["_id"] }, { isDeleted: true }).exec();
      pubcodeEntityFromDB = await pubcodeEntity.findOne({ repo_name: req.params.repo_name }).exec();
      console.info(pubcodeEntityFromDB);
      res.status(200).json({ message: "Repo Marked as soft deleted." });
    }
  } catch (e) {
    console.error(e);
  }

};
module.exports = {
  bulkLoad,
  readAll,
  findById,
  health,
  softDeleteRepo
};
