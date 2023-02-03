const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pubcode = new Schema(
  {
    repo_name: {
      type: String
    },
    product_information: {
      type: Object
    },
    data_management_roles: {
      type: Object
    },
    product_technology_information: {
      type: Object
    },
    product_external_dependencies: {
      type: Object
    },
    bcgov_pubcode_version: {
      type: Number
    }
  },
  { collection: "pubcode" }
);

module.exports = mongoose.model("pubcode", pubcode);
