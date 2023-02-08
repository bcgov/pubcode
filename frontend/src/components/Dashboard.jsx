import { Paper } from "@material-ui/core";

export default function Dashboard() {
  return (
    <Paper elevation={4} style={{marginTop:"-10rem"}}>
      <h4>Welcome to BCGov Public Code tool (Alpha).</h4>
      <span style={{textAlign:"left"}}>This tool allows you to achieve the below. <ol>
          <li>Create a BCGov Public Code yaml(bcgovpubcode.yml) file from scratch.</li>
          <li>Import a BCGov Public Code yaml(bcgovpubcode.yml) file from github and edit.</li>
         {/* <li>Search on various attributes of all the BCGov Public Code yaml file from github (TBD).</li>*/}
        </ol></span>
    </Paper>
  );
}
