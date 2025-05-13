import { Box, Paper } from '@mui/material';
import { env } from "../../env";
export default function PowerBiDashboard() {
    const powerBIURL = env.VITE_POWERBI_URL;
    
    return (
        <Box 
            sx={{ 
                width: '100%', 
                height: '100vh', // Full viewport height
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                ml: { sm: "-15rem" }, // Remove left margin
            }}
        >
            <Paper 
                elevation={6}
                sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    overflow: 'hidden',
                    borderRadius: 1,
                    ml: '0 !important', // Remove left margin
                    pl: 0, // Remove left padding
                }}
            >
                <Box
                    component="iframe"
                    title="PubCode Dashboard"
                    
                    src={powerBIURL}
                    sx={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    allowFullScreen
                />
            </Paper>
        </Box>
    );
}