import { useEffect, useState } from "react";
import Form, { Widgets } from "@rjsf/mui";
import PropTypes from "prop-types";
import validator from "@rjsf/validator-ajv8";
import * as YAML from "js-yaml";
import { env } from "../../env";
//import * as localSchema from "../../../schema/bcgovpubcode.json"; // uncmmment this line for local schema for testing
import { useLocation, useNavigate } from "react-router";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import * as _ from "lodash";
// below props needs to be treated properly for the form to work properly as the nesting does not work if they are undefined.
const props = ["product_information.business_capabilities_standard", "product_technology_information.ci_cd_tools", "product_technology_information.data_storage_platforms", "product_technology_information.frontend_frameworks", "product_technology_information.hosting_platforms", "product_technology_information.spatial_mapping_technologies", "product_external_dependencies.common_components", "product_external_dependencies.identity_authorization"];
const jsonSchemaBranch = env.VITE_SCHEMA_BRANCH || "main";

// ponytail: MUI Select leaves multiple menus open after a choice. Close on the menu click that selected the item.
// Ceiling: if a later MUI stops bubbling that click, close from the item handler in a local Select instead.
function ClosingSelectWidget(props) {
  const [open, setOpen] = useState(false);
  if (!props.multiple) {
    return <Widgets.SelectWidget {...props} />;
  }
  const select = props.options?.mui?.rjsfSlotProps?.select;
  const options = {
    ...props.options,
    mui: {
      ...props.options?.mui,
      rjsfSlotProps: {
        ...props.options?.mui?.rjsfSlotProps,
        select: {
          ...select,
          open,
          onOpen: () => setOpen(true),
          onClose: () => setOpen(false),
          MenuProps: {
            ...select?.MenuProps,
            onClick: () => setOpen(false),
          },
        },
      },
    },
  };
  return <Widgets.SelectWidget {...props} options={options} />;
}

ClosingSelectWidget.propTypes = {
  multiple: PropTypes.bool,
  options: PropTypes.shape({
    mui: PropTypes.shape({
      rjsfSlotProps: PropTypes.shape({
        select: PropTypes.object,
      }),
    }),
  }),
};

function removeBlankFields(jsonData) {
  if (jsonData) {
    for (const replaceProp of props) {
      const existingValue = _.get(jsonData, replaceProp);
      if (existingValue !== undefined && existingValue !== null && Array.isArray(existingValue) && existingValue.length === 0) {
        _.unset(jsonData, replaceProp);
      }
    }
    const trimmedData = _.pickBy(jsonData, value => {
      return !_.isEmpty(value);
    });
    trimmedData.bcgov_pubcode_version = jsonData.bcgov_pubcode_version; // special case for this field as it is not in the props array
  }
  return jsonData;
}

const FormComponent = () => {
  let initialFormData = null;
  const location = useLocation();
  const data = location?.state?.data;
  if (data) {
    initialFormData = data;
  }
  // keep the below in sync with the schema so that the form in UI works properly with showing the correct fields for all of
  const [formData] = useState(initialFormData || {
    "version": 1,
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

  const [schema, setSchema] = useState(null);
  //const [schema, setSchema] = useState(localSchema); // uncomment this line for local schema for testing
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/bcgov/pubcode/${jsonSchemaBranch}/schema/bcgovpubcode.json`
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
  }, [schema]);

  const uiSchema = {
    "ui:submitButtonOptions": {
      "props": {
        id: "submit",
        sx:{
          background: "var(--surface-color-primary-button-default)",
          color: "var(--icons-color-primary-invert)",
          marginBottom: "1rem",
        }
      },
      submitText: "Submit"
    }
  };

  const onSubmit = ({ formData }) => {
    const updatedData = removeBlankFields(formData);
    let yaml = YAML.dump(updatedData, { indent: 2, sortKeys: true });
    console.info(typeof yaml);
    yaml = "---\n" + yaml; // add standard header for yaml file
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
          widgets={{ SelectWidget: ClosingSelectWidget }}
          formData={formData}
          onSubmit={onSubmit}
          validator={validator}
        />
      )}
    </div>
  );
};
export default FormComponent;