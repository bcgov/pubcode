const express = require("express");
const router = express.Router();
const { bulkLoad, readAll, findById, health } = require("../services/pub-code-service");

/**
 * @swagger
 * /api/pub-code/health:
 *   get:
 *     summary: Check API health
 *     responses:
 *       '200':
 *         description: OK
 */
router.get("/health", health);
/**
 * @swagger
 * /api/pub-code/bulk-load:
 *   post:
 *     summary: Bulk load public codes
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 */
router.post("/bulk-load", (req, res, next) => {
  if (req.header("X-API-KEY") && req.header("X-API-KEY") === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}, bulkLoad);

/**
 * @swagger
 * /api/pub-code:
 *   get:
 *     summary: Get all public codes
 *     responses:
 *       '200':
 *         description: OK
 */
router.get("/", readAll);

module.exports = router;
