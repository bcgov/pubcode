import React from "react";
import { Button } from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1)
    },
    button: {
      margin: "0.2em",
      padding: "0.2em",
      color: "#ffffff",
      backgroundColor: "#355992"
    }
  }
}));

export default function SelectionPage({ onButtonClick }) {
  const classes = useStyles();

  const handleEdit = (event) => {
    event.preventDefault();
    onButtonClick({ form: "edit", formData: {} });
  };

  const handleNew = (event) => {
    event.preventDefault();
    onButtonClick({ form: "new" });
  };

  return (
    <div className={classes.root}>
      <Button
        variant="contained"
        color="default"
        component="a"
        href="#"
        onClick={handleEdit}
      >
        Start From Existing Yaml
      </Button>

      <Button
        className={classes.button}
        variant="contained"
        color="default"
        component="a"
        href="#"
        onClick={handleNew}
      >
        Start From Blank Form.
      </Button>
    </div>
  );
}
