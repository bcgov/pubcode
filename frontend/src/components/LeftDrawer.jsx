import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { Button, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function LeftDrawer() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Responsive drawer width
  const drawerWidth = isMobile ? "8rem" : isTablet ? "9rem" : "10rem";

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
          mt: { xs: "3rem", sm: "3.5rem", md: "4rem" },
          maxHeight: { xs: "45vh", sm: "45vh", md: "45vh" },
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
          {
            key: "Dashboard",
            route: "/powerbi-dashboard",
            description: "View the powerbi dashboard",
            icon: "Dashboard",
          },
        ].map((element) => (
          <ListItem key={element.key}>
            <Button
              sx={{
                background: "var(--surface-color-primary-button-default)",
                color: "var(--icons-color-primary-invert)",
                fontSize: "0.2rem !important",
              }}
              variant="contained"
              id={element.key}
              onClick={() => buttonClicked(element)}
              fullWidth
              
            >
              <ListItemText 
                primary={element.key} 
                slotProps={{
                  primary: {
                    fontSize: {
                      sx:"0.5rem",
                      sm: "0.7rem",
                      md: "0.8rem",
                      lg: "0.8rem",
                    },
                    textAlign: "center",
                  },
                }}
              />
            </Button>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
