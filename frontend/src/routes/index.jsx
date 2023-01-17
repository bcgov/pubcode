import { Routes, Route } from "react-router-dom";
import FormComponent from "../components/FormComponent.jsx";
import YamlDisplay from "../components/YamlDisplay";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FormComponent />} />
      <Route path="/yaml" element={<YamlDisplay/>} />
    </Routes>
  );
}
