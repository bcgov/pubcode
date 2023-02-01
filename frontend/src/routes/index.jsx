import { Routes, Route } from "react-router-dom";
import FormComponent from "../components/FormComponent.jsx";
import YamlDisplay from "../components/YamlDisplay";
import Dashboard from "../components/Dashboard.jsx";
import EditForm from "../components/EditForm.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/form" element={<FormComponent />} />
      <Route path="/edit-form" element={<EditForm />} />
      <Route path="/yaml" element={<YamlDisplay/>} />
    </Routes>
  );
}
