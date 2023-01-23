import React, { useEffect, useState } from "react";
import Form from "@rjsf/material-ui";
import validator from "@rjsf/validator-ajv8";
import * as YAML from "js-yaml";
//import * as schema from "../../../schema/bcgovpubcode.json";
import { useNavigate } from "react-router";

const FormComponent = () => {
  const [formData, setFormData] = useState({});
  const [schema, setSchema] = useState(null);
  const [yaml, setYaml] = useState(null);
  const [newForm, setNewForm] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [error, setError] = useState(null);
  const [formEnabled, setFormEnabled] = useState(true);
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

    fetchData();
  }, []);

  const uiSchema = {};

  const onSubmit = ({ formData }) => {
    const yaml = YAML.dump(formData, { indent: 2, sortKeys: true });
    setYaml(yaml);
    setFormEnabled(false);
    navigate("/yaml", { state: { data: yaml } });
  };


  if (!schema) {
    return <div>Loading data...</div>;
  } else if (error) {
    return <div>{error}</div>;
  }

  // render the component using the data from the JSON file
  return (
    <div className="appContent">
      {/*{!this.state.formEnabled && (
          <SelectionPage onButtonClick={handleButtonClick}></SelectionPage>
        )}*/}
      {schema && (
        <Form
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
