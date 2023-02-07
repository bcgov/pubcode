const express = require("express");
const morgan = require("morgan");
const nocache = require("nocache");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const apiRouter = express.Router();
const pubcodeRouter = require("./routes/pubcode-router");
const log = require("./logger");
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const logStream = {
  write: (message) => {
    log.info(message);
  }
};
app.set("trust proxy", 1);
app.use(limiter);
app.use(cors());
app.use(helmet());
app.use(nocache());

//tells the app to use json as means of transporting data
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: "50mb"
}));
app.use(morgan("dev", { stream: logStream }));
app.get("/", (req, res, next) => {
  res.sendStatus(200);// generally for route verification.
});
app.use(/(\/api)?/, apiRouter);
apiRouter.use("/pub-code", pubcodeRouter);

module.exports = app;
