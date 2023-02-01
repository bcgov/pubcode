import React, { useEffect, useState } from "react";
import Form from "@rjsf/material-ui";
import validator from "@rjsf/validator-ajv8";
import * as YAML from "js-yaml";
import * as localSchema from "../../../schema/bcgovpubcode.json";
import { useLocation, useNavigate } from "react-router";
import { Backdrop, CircularProgress } from "@mui/material";

const FormComponent = () => {
  let initialFormData = null;
  const location = useLocation();
  const data = location?.state?.data;
  if (data) {
    initialFormData = data;
  }
  // keep the below in sync with the schema so that the form in UI works properly with showing the correct fields for all of
  const [formData, setFormData] = useState(initialFormData || {
    "bcgov_pubcode_version": 1,
    "data_management_roles": {
      "data_custodian": undefined,
      "product_owner": undefined
    },
    "product_information": {
      "business_capabilities_standard": [],
      "ministry": undefined,
      "product_acronym": undefined,
      "product_description": undefined,
      "product_name": undefined,
      "program_area": undefined
    },
    "product_technology_information": {
      "data_storage_platforms": [],
      "ci_cd_tools": [],
      "frontend_frameworks": [],
      "hosting_platforms": [],
      "spatial_mapping_technologies": []
    }
  });

  const [schema, setSchema] = useState(localSchema);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/bcgov/public-code/main/schema/bcgovpubcode.json"
        );
        const data = await response.json();
        setSchema(data);
      } catch (error) {
        console.error(error);
        setError("error loading the schema from github, try again later");
      }
    }

    if (!schema) {
      fetchData();
    }
  }, []);

  const uiSchema = {};

  const onSubmit = ({ formData }) => {
    const yaml = YAML.dump(formData, { indent: 2, sortKeys: true });
    navigate("/yaml", { state: { data: yaml } });
  };


  if (!schema) {
    return (<Backdrop
      sx={{ color: "#355992", background: "#FFFFFF", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={!schema}
    >
      <CircularProgress variant="indeterminate" color="inherit" />
    </Backdrop>);
  } else if (error) {
    return <div>{error}</div>;
  }

  // render the component using the data from the JSON file
  return (
    <div className="appContent">
      {schema && (
        <Form
          showErrorList={"bottom"}
          liveValidate
          noHtml5Validate
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onSubmit={onSubmit}
          validator={validator}
        />
      )}
    </div>
  );
};
export default FormComponent;
