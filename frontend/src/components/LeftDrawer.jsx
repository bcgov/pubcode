import * as React from "react";
import {
  Button,
  Drawer,
  Icon,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
export default function LeftDrawer() {
  const navigate = useNavigate();
  const drawerWidth = "10rem";

  const buttonClicked = (event) => {
    console.log(event);
    navigate(event.route, { state: { data: undefined } });
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          mt: "4rem",
          maxHeight: "25vh",
          bottom: "20rem",
          border: "none",
        },
      }}
    >
      <List>
        {[
          {
            key: "New",
            route: "/form",
            description: "Create a new bcgovpubcode yml file",
            icon: "Add",
          },
          {
            key: "Edit",
            route: "/edit",
            description: "Edit an existing bcgovpubcode yml file",
            icon: "Edit",
          },
        ].map((element) => (
          <ListItem key={element.key}>
            <Button
              sx={{
                background: "var(--surface-color-primary-button-default)",
                color: "var(--icons-color-primary-invert)",
              }}
              variant="contained"
              id={element.key}
              onClick={() => buttonClicked(element)}
              fullWidth
              endIcon={
                (element.icon === "Edit" && <EditIcon />) ||
                (element.icon === "Add" && <AddIcon />)
              }
            >
              <ListItemText primary={element.key} />
            </Button>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
