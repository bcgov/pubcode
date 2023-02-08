import * as React from "react";
import { Button, Divider, Drawer, Icon, List, ListItem, ListItemText, Tooltip } from "@material-ui/core";
import { useNavigate } from "react-router";
import { Add, Edit, Search } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  disabled: {
    color: theme.palette.text.disabled,
    backgroundColor: theme.palette.action.disabledBackground,
    width: "10em !important"
  },
  leftDrawer: {
    color: "#ffffff !important",
    backgroundColor: "#355992 !important",
    borderRadius: "0.3em !important",
    width: "10em !important"
  }
}));
export default function LeftDrawer() {
  const classes = useStyles();
  const navigate = useNavigate();
  const buttonClicked = (event) => {
    navigate(event.route, { state: { data: undefined } });// reset the state
  };
  return (
    <div>
      <Drawer style={{ zIndex: "0 !important", backgroundColor:"#fafafa", top: "4em !important" }}
              variant="permanent"
              open={true}
      >
        <List>
          {
            [
              {
                key: "New",
                route: "/form",
                description: "Create a new bcgovpubcode yml file",
                icon: "Add"
              },
              {
                key: "Edit",
                route: "/edit-form",
                description: "Edit an existing bcgovpubcode yml file",
                icon: "Edit"
              },
              /*{
                key: "Search",
                route: "/search",
                icon: "Search",
                description: "Search for a repository",
                disabled: true
              }*/].map((element) => (
              <ListItem key={element.key}>
                <Button className={element.disabled ? `${classes.disabled}` : `${classes.leftDrawer}`} disabled={element.disabled}
                        onClick={() => buttonClicked(element)}>
                  <ListItemText primary={element.key} />
                  <Tooltip title={element.description}>
                    <Icon style={{ lineHeight: 1 }}>
                      {element.icon === "Search" && <Search />}
                      {element.icon === "Edit" && <Edit />}
                      {element.icon === "Add" && <Add />}
                    </Icon>
                  </Tooltip>
                </Button>
              </ListItem>
            ))
          }
        </List>
      </Drawer>

    </div>
  );
}
