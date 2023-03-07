"use strict";
const CronJob = require("cron").CronJob;
const log = require("../logger");
const cacheService = require("../services/cache-service");
try {
  // reload the cache every 5 minutes
  const reloadCache = new CronJob("0 0/5 * * * *", async () => {
    log.debug("Starting reload cache");
    try {
      await cacheService.loadAllPubCodes();
      log.debug("reload cache completed");
    } catch (e) {
      log.error(e);
    }
  });
  reloadCache.start();
} catch (e) {
  log.error(e);
}
