import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();
  const buttonClicked = () => {
    navigate("/", { state: { data: undefined } });// reset the state
  };
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh"
      }}
    >
      <Container maxWidth="md">
        <Grid2>
          <Typography variant="h1">
            404
          </Typography>
          <Typography variant="h6">
            The page you’re looking for does not exist.
          </Typography>
          <Button onClick={() => buttonClicked()} variant="contained">Back Home</Button>
        </Grid2>
      </Container>
    </Box>
  );
}