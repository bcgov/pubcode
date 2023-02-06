import "./App.css";
import React from "react";
import BCGovLogo from "./assets/gov-bc-logo-horiz.png";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/index.jsx";
import { AppBar, Button, Container, CssBaseline, Grid, IconButton, Toolbar, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import LeftDrawer from "./components/LeftDrawer.jsx";
import { HomeRounded } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  menu: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  },
  appBarHeader: {
    top: "auto",
    bottom: 0,
    color: "#ffffff",
    backgroundColor: "#355992",
    borderBottom: "2px solid #fcba19"
  },
  appBar: {
    flexShrink: 0,
    top: "auto",
    bottom: 0,
    color: "#ffffff",
    backgroundColor: "#355992"
  },
  toolbar: {
    alignItems: "center",
    justifyContent: "space-between"
  },
  footerButton: {
    margin: "0.2em",
    padding: "0.2em",
    backgroundColor: "#ffffff"
  },
  headerTitle: {
    flexGrow: 0.9,
    fontSize: "1.5em",
    align: "center",
    alignItems: "center"
  }
}));

function App() {
  const classes = useStyles();
  return (
    <Container style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CssBaseline />
      <AppBar position="fixed" style={{ flexShrink: 0 }}>
        <Toolbar className={classes.appBarHeader}>
          <img src={BCGovLogo} />
          <Typography className={classes.headerTitle}>
            BCGov Public Code
          </Typography>
          <a href={"/"} target={"_self"}>
            <IconButton style={{ backgroundColor: "#FFFFFF" }}>
              <HomeRounded color="primary"></HomeRounded>
            </IconButton>
          </a>
        </Toolbar>
      </AppBar>

      <BrowserRouter>
        <Grid position={"static"} container spacing={0}>
          <Grid position={"static"} item xs={2} sm={2} md={2} lg={false} xl={false}>
            <LeftDrawer />
          </Grid>
          <Grid position={"static"} item xs={10} sm={10} md={10} lg={12} xl={12}>
            <AppRoutes />
          </Grid>
        </Grid>
      </BrowserRouter>
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Container>
  );
}

export default App;
