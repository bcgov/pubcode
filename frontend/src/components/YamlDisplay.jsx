import { CopyToClipboard } from "react-copy-to-clipboard";
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
      type: "application/x-yaml;charset=utf-8"
    });
    saveAs(blob, "bcgovpubcode.yml");
    toast.success("bcgovpubcode.yml downloaded!");
  };
  const handleCopy = () => {
    toast.success("yaml copied!");
  };
  return (
    <div className="appContent yamlContent">
      <CopyToClipboard
        text={data}
        onCopy={handleCopy}
      >
        <Button id="copy" className="customButton" variant="contained">
          Copy
        </Button>
      </CopyToClipboard>
      <Button
        id="download"
        className="customButton"
        variant="contained"
        onClick={handleDownload}
      >
        Download
      </Button>
      <SyntaxHighlighter
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
