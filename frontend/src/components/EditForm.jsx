import Form from "@rjsf/material-ui";
import validator from "@rjsf/validator-ajv8";
import React, { useState } from "react";
import { toast } from "react-toastify";
import * as YAML from "js-yaml";
import * as _ from "lodash";
import { Backdrop, CircularProgress } from "@material-ui/core";
import { useNavigate } from "react-router";

// below props needs to be treated properly for the form to work properly as the nesting does not work if they are undefined.
const props = ["product_information.business_capabilities_standard", "product_technology_information.ci_cd_tools", "product_technology_information.data_storage_platforms", "product_technology_information.frontend_frameworks", "product_technology_information.hosting_platforms", "product_technology_information.spatial_mapping_technologies", "product_external_dependencies.common_components", "product_external_dependencies.identity_authorization"];

function matchFormattingForFormDisplay(existingYamlAsJson) {
  if (existingYamlAsJson) {
    for (const replaceProp of props) {
      const existingValue = _.get(existingYamlAsJson, replaceProp);
      if (existingValue === undefined || existingValue === null) {
        _.set(existingYamlAsJson, replaceProp, []);
      }
    }
  }
  return existingYamlAsJson;
}

export default function EditForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [formDisabled, setFormDisabled] = useState(false);
  const onSubmit = async ({ formData }) => {
    setFormDisabled(true);
    if (formData.bcgovpubcode_url && formData.bcgovpubcode_url.includes("bcgovpubcode.yml")) {
      try {
        let url;
        if (formData.bcgovpubcode_url && formData.bcgovpubcode_url.includes("raw.githubusercontent.com")) {
          url = formData.bcgovpubcode_url;
        } else {
          url = formData.bcgovpubcode_url.replace("https://github.com", "https://raw.githubusercontent.com").replace("/blob/", "/");
        }
        const response = await fetch(url);
        if(response.ok){
          const data = await response.text();
          const existingYamlAsJson = YAML.load(data);
          const updatedData = matchFormattingForFormDisplay(existingYamlAsJson);
          navigate("/form", { state: { data: updatedData } });
        }else {
          console.error('looks like there was a problem, status code: ' + response.status);
          toast.error("bcgovpubcode.yml could not be found at the link :(");
          setFormDisabled(false);
        }
      } catch (e) {
        console.error(e);
        toast.error("Please provide a valid link to bcgovpubcode.yml :(");
        setFormDisabled(false);
      }
    } else {
      toast.error("Please provide a valid link to bcgovpubcode.yml :(");
      setFormDisabled(false);
    }
  };
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "GitHub Public Code Yml Link",
    description: "The link to the bcgovpubcode.yml file in the github repo",
    properties: {
      bcgovpubcode_url: {
        type: "string",
        format: "uri",
        title: "GitHub Link",
        minlength: 1
      }
    },
    required: ["bcgovpubcode_url"]

  };
  const uiSchema = {
    "ui:submitButtonOptions": {
      "props": {
        "disabled": formDisabled
      }
    }
  };
  if (formDisabled) {
    return (<Backdrop
      sx={{ color: "#355992", background: "#FFFFFF", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={!schema}
    >
      <CircularProgress variant="indeterminate" color="inherit" />
    </Backdrop>);
  }
  return (
    <div className="appContent">
      <Form className={"editForm"}
            schema={schema}
            noHtml5Validate
            formData={formData}
            onSubmit={onSubmit}
            uiSchema={uiSchema}
            validator={validator} /></div>);
};
