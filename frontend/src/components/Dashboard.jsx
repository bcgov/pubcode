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
             BCGov Pubcode Product Metadata Tool.
            </Typography>

            <Box component="ol" sx={{ ml: 2 }}>
              <Typography component="li">
                Use this simple tool to create or update bcgovpubcode.yaml file.   
              </Typography>
              <Typography component="li">
                Place it in the root of your github repo.
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'left', color: 'text.secondary' }}>
              If it seems too simple, that&apos;s because we designed it with your busy schedule in mind.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}