import { Routes, Route } from "react-router";
import Dashboard from "../components/Dashboard";
import FormComponent from "../components/FormComponent";
import YamlDisplay from "../components/Yaml";
import EditForm from "../components/EditForm";
import NotFound from "../components/NotFound";
import PowerBiDashboard from "../components/PowerBIDashboard";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/form" element={<FormComponent />} />
      <Route path="/edit" element={<EditForm />} />
      <Route path="/yaml" element={<YamlDisplay/>} />
      <Route path="/powerbi-dashboard" element={<PowerBiDashboard />} />
      <Route path="*" element={<NotFound/>} />

      {/* <Route path="/edit-form" element={<EditForm />} />
      <Route path="/yaml" element={<YamlDisplay/>} />  */}
      {/*<Route path="/card" element={<RecipeReviewCard/>} />*/}
      {/* <Route path="*" element={<NotFound/>} /> */}
    </Routes>
  );
}
