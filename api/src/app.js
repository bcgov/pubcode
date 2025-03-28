const express = require("express");
const morgan = require("morgan");
const nocache = require("nocache");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const apiRouter = express.Router();
const pubcodeRouter = require("./routes/pubcode-router");
const log = require("./logger");
const prom = require('prom-client');
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(nocache());
app.get('/metrics', async (_req, res) => {
  const appMetrics = await register.metrics();
  res.end(appMetrics);
});
//tells the app to use json as means of transporting data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev", { stream: logStream,
  skip: (req, _res) => req.url === '/health' || req.url === '/'
}));
app.get("/", (req, res, next) => {
  res.sendStatus(200);// generally for route verification.
});
app.use(/(\/api)?/, apiRouter);
apiRouter.use("/pub-code", pubcodeRouter);
app.use((req, res, next) => {
  res.status(404).send(
    "<h1>Not Found.</h1>");
});

module.exports = app;
