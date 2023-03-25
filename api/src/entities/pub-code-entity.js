const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pubcode = new Schema(
  {
    repo_name: {
      type: String,
      required: true
    },
    product_information: {
      type: Object,
      required: true
    },
    data_management_roles: {
      type: Object,
      required: true
    },
    product_technology_information: {
      type: Object,
      required: true
    },
    product_external_dependencies: {
      type: Object
    },
    version: {
      type: Number,
      required: true
    },
    github_info: {
      type: Object
    }
  },
  { collection: "pubcode" }
);

module.exports = mongoose.model("pubcode", pubcode);
