import { Paper, Box, Container, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Box
      component="main"
      sx={{
        width: '90%',
        ml: '-5em'
      }}
    >
      <Box sx={{ mt: 2 }}>
        <Container maxWidth="xl">
          <Paper 
            elevation={4}
            sx={{
              p: 4, // padding
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
            }}
          >
            <Typography variant="h3" gutterBottom>
              Welcome to BCGov Pubcode tool (Alpha).
            </Typography>
            <Typography variant="body">
              This tool allows you to achieve the below.
            </Typography>
            <Box component="ol" sx={{ ml: 2 }}>
              <Typography component="li">
                Create a BCGov Public Code yaml(bcgovpubcode.yml) file from scratch.
              </Typography>
              <Typography component="li">
                Import a BCGov Public Code yaml(bcgovpubcode.yml) file from github and edit.
              </Typography>
              <iframe title="PubCode Dashboard" width="600" height="373.5" src="https://app.powerbi.com/view?r=eyJrIjoiNmFjN2IwOWEtMmQ5NS00OTBiLWI4ZTEtODFiNTRiOTU0NTBiIiwidCI6IjZmZGI1MjAwLTNkMGQtNGE4YS1iMDM2LWQzNjg1ZTM1OWFkYyJ9" frameborder="0" allowFullScreen="true"></iframe>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}