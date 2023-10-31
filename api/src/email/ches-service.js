const ClientConnection = require("./connection");

const SERVICE = "CHES";

class ChesService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl }) {
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      console.log("Invalid configuration.", { function: "constructor" });
      throw new Error("ChesService is not configured. Check configuration.");
    }
    this.connection = new ClientConnection({
      tokenUrl,
      clientId,
      clientSecret
    });
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
  }

  async health() {
    try {
      const { data, status } = await this.axios.get(`${this.apiUrl}/health`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      return { data, status };
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  async getStatus(params, query) {
    try {
      if (params?.msgId) {
        const { data, status } = await this.axios.get(
          `${this.apiUrl}/status/${params.msgId}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        return { data, status };
      } else {
        const { data, status } = await this.axios.get(`${this.apiUrl}/status`, {
          params: query,
          headers: {
            "Content-Type": "application/json"
          }
        });
        return { data, status };
      }
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  async cancel(params, query) {
    try {
      if (params?.msgId) {
        const { data, status } = await this.axios.delete(
          `${this.apiUrl}/cancel/${params.msgId}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        return { data, status };
      } else {
        const { data, status } = await this.axios.delete(
          `${this.apiUrl}/cancel`,
          {
            params: query,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        return { data, status };
      }
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  async send(email) {
    try {
      const { data, status } = await this.axios.post(
        `${this.apiUrl}/email`,
        email,
        {
          headers: {
            "Content-Type": "application/json"
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return { data, status };
    } catch (e) {
      console.error(e);
      console.error(SERVICE, e?.config?.data?.errors);
    }
  }

  async merge(mergeData) {
    try {
      const { data, status } = await this.axios.post(
        `${this.apiUrl}/emailMerge`,
        mergeData,
        {
          headers: {
            "Content-Type": "application/json"
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return { data, status };
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  async mergePeview(mergeData) {
    try {
      const { data, status } = await this.axios.post(
        `${this.apiUrl}/emailMerge/preview`,
        mergeData,
        {
          headers: {
            "Content-Type": "application/json"
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return { data, status };
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  async promote(params, query) {
    try {
      if (params?.msgId) {
        const { data, status } = await this.axios.post(
          `${this.apiUrl}/promote/${params.msgId}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        return { data, status };
      } else {
        const { data, status } = await this.axios.post(
          `${this.apiUrl}/promote`,
          {
            params: query,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        return { data, status };
      }
    } catch (e) {
      console.error(SERVICE, e);
    }
  }

  generateHtmlEmail(subjectLine, to, title, body) {

    const emailContents= `<!DOCTYPE html>
            <html lang="en">
              <head>
                <title>${title}</title>
              </head>
              <body>
                ${body}
              </body>
            </html>`;
    return {
      bodyType: 'html',
      body: emailContents,
      delayTS: 0,
      encoding: 'utf-8',
      from: "no-reply-bcgovpubcode@gov.bc.ca",
      priority: 'normal',
      subject: subjectLine,
      to: to
    };
  }
}

module.exports = ChesService;
