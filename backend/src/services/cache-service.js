const pubcodeEntity = require("../entities/pub-code-entity");
let PUB_CODES = [];
const cacheService = {

  async loadAllPubCodes() {
    const data = await pubcodeEntity.find({});
    const newPubCodes = [];
    for (const individualData of data) {
      const normalizedResult = {
        repo_name: individualData.repo_name,
        ...individualData.product_information,
        ...individualData.product_technology_information,
        ...individualData.product_external_dependencies,
        ...individualData.data_management_roles
      };
      newPubCodes.push(normalizedResult);
    }
    // clear the existing cache
    if (PUB_CODES && PUB_CODES.length > 0) {
      PUB_CODES = [];
    }
    PUB_CODES = newPubCodes;
    return PUB_CODES;
  },
  getAllPubCodes() {
    return PUB_CODES;
  }
};
module.exports = cacheService;
