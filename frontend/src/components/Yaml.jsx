import { Button } from "@mui/material";
import SyntaxHighlighter from "react-syntax-highlighter";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router";
import { saveAs } from "file-saver";
import { useEffect } from "react";

const yamlDisplayGuard = (location) => {
  if (!location.state) {
    console.error("No data found, redirecting to home page");
    return false;
  }
  return true;
};

function YamlDisplay() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!yamlDisplayGuard(location)) {
      navigate("/");
    }
  }, [location, navigate]);

  const data = location?.state?.data;
  const handleDownload = () => {
    const blob = new Blob([data.toString()], {
      type: "application/x-yaml;charset=utf-8",
    });
    saveAs(blob, "bcgovpubcode.yml");
    toast.success("bcgovpubcode.yml downloaded!");
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("yaml copied!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="appContent yamlContent">
      <Button
        sx={{
          background: "var(--surface-color-primary-button-default)",
          color: "var(--icons-color-primary-invert)",
        }}
        onClick={() => copyText(data)}
        id="copy"
        className="customButton"
        variant="contained"
      >
        Copy
      </Button>
      <Button
        sx={{
          background: "var(--surface-color-primary-button-default)",
          color: "var(--icons-color-primary-invert)",
        }}
        id="download"
        className="customButton"
        variant="contained"
        onClick={handleDownload}
      >
        Download
      </Button>
      <SyntaxHighlighter
        id="yamlSyntaxHighlighter"
        language="yaml"
        showLineNumbers={false}
        wrapLines={true}
      >
        {data}
      </SyntaxHighlighter>
    </div>
  );
}

export default YamlDisplay;
