import React from "react";
import Form from "@rjsf/material-ui";
import validator from "@rjsf/validator-ajv8";
import * as YAML from "js-yaml";
import SyntaxHighlighter from "react-syntax-highlighter";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { saveAs } from "file-saver";
import { Button } from "@material-ui/core/";
import { toast } from "react-toastify";

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      yaml: null,
      newForm: false,
      editForm: false,
      error: null,
      formEnabled: true,
      formData: {},
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
      this.setState({
        error: "error loading the schema from github, try again later",
      });
    }
  }

  render() {
    const handleDownload = () => {
      const blob = new Blob([this.state.yaml.toString()], {
        type: "application/x-yaml;charset=utf-8",
      });
      saveAs(blob, "bcgovpubcode.yml");
      toast.success("bcgovpubcode.yml downloaded!");
    };
    const handleCopy = () => {
      toast.success("yaml copied!");
    };
    const uiSchema = {};
    const onSubmit = ({ formData }) => {
      const yaml = YAML.dump(formData, { indent: 2 });
      this.setState({ yaml, formEnabled: false });
      console.info(yaml);
    };
    const handleButtonClick = (value) => {
      // for future use
      console.info(value);
      if (value?.form === "new") {
        this.setState({ formEnabled: true });
      } else if (value?.form === "edit") {
        this.setState({ formData: value.formData, formEnabled: true });
      }
    };
    const style = {
      margin: "2em",
      padding: "2em",
      background: "#d7d1d1",
      fontSize: "14px",
      lineHeight: "24px",
    };
    if (!this.state?.data) {
      return <div>Loading data...</div>;
    } else if (this.state.error) {
      return <div>{this.state.error}</div>;
    }

    // render the component using the data from the JSON file
    return (
      <div>
        {/*{!this.state.formEnabled && (
          <SelectionPage onButtonClick={handleButtonClick}></SelectionPage>
        )}*/}
        {this.state.formEnabled && (
          <Form
            liveValidate
            noHtml5Validate
            schema={this.state?.data}
            uiSchema={uiSchema}
            formData={this.state.formData}
            onSubmit={onSubmit}
            validator={validator}
          />
        )}
        {this.state.yaml && (
          <div>
            <CopyToClipboard
              text={this.state.yaml.toString()}
              onCopy={handleCopy}
            >
              <Button id="copy" className="customButton" variant="contained">
                Copy
              </Button>
            </CopyToClipboard>
            <Button
              id="download"
              className="customButton"
              variant="contained"
              onClick={handleDownload}
            >
              Download
            </Button>
            <SyntaxHighlighter
              language="yaml"
              styles={style}
              showLineNumbers={false}
              wrapLines={true}
            >
              {this.state.yaml.toString()}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    );
  }
}
