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
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");


const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
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
app.use(morgan("dev", {
  stream: logStream,
  skip: (req, _res) => req.url === "/health" || req.url === "/"
}));
app.get("/", (req, res, next) => {
  res.sendStatus(200);// generally for route verification.
});
app.use(/(\/api)?/, apiRouter);
// Generate the OpenAPI spec file
const options = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Public Code API",
      version: "1.0.0"
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-KEY"
      }
    }
  }
  ,
  apis: ["./src/routes/*.js"] // Path to the API routes
};
const specs = swaggerJsdoc(options);
// Serve the Swagger UI
apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
apiRouter.use("/pub-code", pubcodeRouter);

module.exports = app;
