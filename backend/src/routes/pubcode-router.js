const express = require("express");
const router = express.Router();
const { bulkLoad, readAll, findById, health } = require("../services/pub-code-service");

router.get("/health", health);
router.post("/bulk-load", (req, res, next) => {
  if (req.header("X-API-KEY") && req.header("X-API-KEY") === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, bulkLoad);

router.get("/", readAll);
router.get("/:id", findById);

module.exports = router;
