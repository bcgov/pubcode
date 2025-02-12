"use strict";

const { createLogger, format, transports } = require("winston");
const { omit } = require("lodash");


/**
 * Handles all the different log formats
 * https://github.com/winstonjs/winston/issues/1427#issuecomment-535297716
 * https://github.com/winstonjs/winston/issues/1427#issuecomment-583199496
 * @param {*} colors
 */
function getDomainWinstonLoggerFormat(colors = true) {
  const colorize = colors ? format.colorize() : null;
  const loggingFormats = [
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS"
    }),
    format.errors({ stack: true }),
    colorize,
    format.printf((info) => {
      const stackTrace = info.stack ? `\n${info.stack}` : "";

      // handle single object
      if (!info.message) {
        const obj = omit(info, ["level", "timestamp", Symbol.for("level")]);
        return `${info.timestamp} - ${info.level}: ${obj}${stackTrace}`;
      }
      const splatArgs = info[Symbol.for("splat")] || [];
      const rest = splatArgs.join(" ");
      return `${info.timestamp} - ${info.level}: ${info.message} ${rest}${stackTrace}`;
    })
  ].filter(Boolean);
  return format.combine(...loggingFormats);
}


const logger = createLogger({
  level: process.env.LOG_LEVEL || "silly",
  format: getDomainWinstonLoggerFormat(true),
  transports: [
    new transports.Console()
  ]
});

module.exports = logger;
