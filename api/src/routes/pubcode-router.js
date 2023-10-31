const express = require("express");
const router = express.Router();
const { bulkLoad, readAll, findById, health, softDeleteRepo } = require("../services/pub-code-service");

router.get("/ip/trace", (request, response) => response.send(request.ip));
router.get("/health", health);
router.post("/bulk-load", (req, res, next) => {
  if (req.header("X-API-KEY") && req.header("X-API-KEY") === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, bulkLoad);
/**
 * This method allows for patching the objects with soft
 */
router.delete("/:repo_name", (req, res, next) => {
  if (req.header("X-API-KEY") && req.header("X-API-KEY") === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, softDeleteRepo);
router.get("/", readAll);

module.exports = router;
