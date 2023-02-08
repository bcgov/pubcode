const pubcodeEntity = require("../entities/pub-code-entity");
let pubCodes = [];
const cacheService = {

  async loadAllPubCodes() {
      const data = await pubcodeEntity.find({});
      for(const individualData of data){
        const normalizedResult = {
          repo_name: individualData.repo_name,
          ...individualData.product_information,
          ...individualData.product_technology_information,
          ...individualData.product_external_dependencies,
          ...individualData.data_management_roles
        };
        pubCodes.push(normalizedResult);
      }
    return pubCodes;
  },
  getAllPubCodes() {
    return pubCodes;
  }
};
module.exports = cacheService;
