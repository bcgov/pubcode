import "@bcgov/bc-sans/css/BC_Sans.css";
import { Footer, Header } from "@bcgov/design-system-react-components";
import "./App.css";
import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter } from "react-router";
import AppRoutes from "./routes/index.jsx";
import LeftDrawer from "./components/LeftDrawer.jsx";
import { ToastContainer } from "react-toastify";
function App() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Box sx={{ position: "fixed", width: "100%", zIndex: 999999 }}>
        <Header title="BCGov Pubcode" />
      </Box>
      <BrowserRouter>
        <Box
          sx={{
            display: "flex",
            flex: 1,
            position: "relative",
            mt: "4rem", // Updated from 65px
          }}
        >
          <LeftDrawer />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - 15rem)` }, // Updated from 240px
              ml: { sm: "15rem" }, // Updated from 240px
            }}
          >
            <AppRoutes />
          </Box>
        </Box>
      </BrowserRouter>
      <Footer />
      <ToastContainer
        style={{ zIndex: 999999 }}
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
    </Box>
  );
}

export default App;
