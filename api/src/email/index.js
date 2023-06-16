const ChesService = require("./ches-service");

const emailService = new ChesService({
  tokenUrl: process.env.CHES_TOKEN_URL,
  clientId: process.env.CHES_CLIENT_ID,
  clientSecret: process.env.CHES_CLIENT_SECRET,
  apiUrl: process.env.CHES_API_URL,
});
module.exports = emailService;
