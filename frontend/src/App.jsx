import "./App.css";

import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { Button } from "@material-ui/core/";
import React from "react";
import FormComponent from "./components/FormComponent.jsx";
import BCGovLogo from "./assets/gov-bc-logo-horiz.png";

const useStyles = makeStyles((theme) => ({
  menu: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  appBar: {
    top: "auto",
    bottom: 0,
    color: "#ffffff",
    backgroundColor: "#355992",
  },
  toolbar: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerButton: {
    margin: "0.2em",
    padding: "0.2em",
  },
  headerTitle: {
    flexGrow: 0.8,
    fontSize: "1.5em",
    align: "center",
    alignItems: "center",
  },
  form: {
    width: "100%",
  },
}));

function App() {
  const classes = useStyles();

  return (
    <div>
      <AppBar position="fixed">
        <Toolbar className={classes.appBar}>
          <img src={BCGovLogo} />
          <Typography className={classes.headerTitle}>
            BCGov Public Code
          </Typography>
        </Toolbar>
      </AppBar>
      <FormComponent className={classes.form} />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          <Typography className={classes.title}>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-home"
              target="_blank"
              href="https://www.gov.bc.ca/"
            >
              Home
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-about"
              target="_blank"
              href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
            >
              About gov.bc.ca
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-disclaimer"
              target="_blank"
              href="https://gov.bc.ca/disclaimer"
            >
              Disclaimer
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-privacy"
              target="_blank"
              href="https://gov.bc.ca/privacy"
            >
              Privacy
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-accessibility"
              target="_blank"
              href="https://gov.bc.ca/webaccessibility"
            >
              Accessibility
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-copyright"
              target="_blank"
              href="https://gov.bc.ca/copyright"
            >
              Copyright
            </Button>
            <Button
              variant="contained"
              className={classes.footerButton}
              id="footer-contact"
              target="_blank"
              href="https://www2.gov.bc.ca/gov/content/home/contact-us"
            >
              Contact Us
            </Button>
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default App;
