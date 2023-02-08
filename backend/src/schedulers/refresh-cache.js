"use strict";
const CronJob = require("cron").CronJob;
const log = require("../components/logger");
const cacheService = require("../services/cache-service");
try {
  // reload the cache every day at 8.30 AM GMT.
  const reloadCache = new CronJob("0 30 8 * * *", async () => {
    log.debug("Starting reload cache");
    try {
      await cacheService.loadAllPubCodes();
    } catch (e) {
      log.error(e);
    }
  });
  reloadCache.start();
} catch (e) {
  log.error(e);
}
