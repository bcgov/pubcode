const crypto = require("node:crypto");
const express = require("express");
const router = express.Router();
const { bulkLoad, readAll, findById, health, softDeleteRepo } = require("../services/pub-code-service");

/**
 * Compare the X-API-KEY header to API_KEY in constant time.
 * Rejects a missing header, an unset API_KEY, or a length mismatch.
 */
function isValidApiKey(provided) {
  const expected = process.env.API_KEY;
  if (!provided || !expected) {
    return false;
  }
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

router.get("/ip/trace", (request, response) => response.send(request.ip));
router.get("/health", health);
router.post("/bulk-load", (req, res, next) => {
  if (isValidApiKey(req.header("X-API-KEY"))) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, bulkLoad);
/**
 * This method allows for patching the objects with soft
 */
router.delete("/:repo_name", (req, res, next) => {
  if (isValidApiKey(req.header("X-API-KEY"))) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, softDeleteRepo);
router.get("/", readAll);

module.exports = router;
