import React, { useState } from "react";
import Form from "@rjsf/material-ui";
import validator from "@rjsf/validator-ajv8";
import * as YAML from "js-yaml";
import SyntaxHighlighter from "react-syntax-highlighter";

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      yaml: null,
    };
  }

  async componentDidMount() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/bcgov/public-code/main/schema/bcgovpubcode.json"
      );
      const data = await response.json();
      this.setState({ data });
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const formData = {};
    const uiSchema = {};
    const onSubmit = ({ formData }) => {
      const yaml = YAML.dump(formData, { indent: 2 });
      this.setState({ yaml });
      console.log(yaml);
    };
    const style = {
      background: "#fafafa",
      fontSize: "14px",
      lineHeight: "24px",
      padding: "10px",
    };
    if (!this.state?.data) {
      return <div>Loading data...</div>;
    }

    // render the component using the data from the JSON file
    return (
      <div>
        {!this.state.yaml && (
          <Form
            schema={this.state?.data}
            uiSchema={uiSchema}
            formData={formData}
            onSubmit={onSubmit}
            validator={validator}
          />
        )}
        {this.state.yaml && (
          <SyntaxHighlighter
            language="yaml"
            styles={style}
            showLineNumbers={false}
            wrapLines={true}
          >
            {this.state.yaml.toString()}
          </SyntaxHighlighter>
        )}
      </div>
    );
  }
}
