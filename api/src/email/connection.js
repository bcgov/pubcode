const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenProvider = require('axios-token-interceptor');

class ClientConnection {

  constructor({tokenUrl, clientId, clientSecret}) {

    if (!tokenUrl || !clientId || !clientSecret) {
      console.log('Invalid configuration.', {function: 'constructor'});
      throw new Error('ClientConnection is not configured. Check configuration.');
    }

    this.tokenUrl = tokenUrl;

    this.axios = axios.create();
    this.clientCreds = oauth.clientCredentials(axios.create(), this.tokenUrl, clientId, clientSecret);
    this.axios.interceptors.request.use(tokenProvider({
      getToken: async () => {
        const data = await this.clientCreds('');
        return data.access_token;
      },
    }));
  }
}

module.exports = ClientConnection;
