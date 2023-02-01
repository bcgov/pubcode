import * as React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router";
import { IconButton, Tooltip } from "@mui/material";
import { Search, Edit, Add } from "@mui/icons-material";


export default function LeftDrawer() {
  const navigate = useNavigate();
  const buttonClicked = (event) => {
    console.info('buttonClicked', event);
    navigate(event.route, { state: { data: undefined } });// reset the state
  };
  return (
    <div>
      <Drawer
        variant="permanent"
        open={true}
      >
        <Divider />
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
              {
                key: "Search",
                route: "/search",
                icon: "Search",
                description: "Search for a repository",
                disabled: true
              }].map((element) => (
              <ListItem  key={element.key}>
                <ListItemButton  dense className={"leftDrawerButtons"} disabled={element.disabled} onClick={() => buttonClicked(element)}>
                  <ListItemText primary={element.key} />
                  <Tooltip title={element.description}>
                    <IconButton className={"leftDrawerButtons"}>
                      {element.icon === "Search" && <Search />}
                      {element.icon === "Edit" && <Edit />}
                      {element.icon === "Add" && <Add />}
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              </ListItem>
            ))
          }
        </List>
        <Divider />
      </Drawer>

    </div>
  );
}
