import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CitizenList from "./pages/CitizenList";
import Families from "./pages/Families";
import AddFamily from "./pages/AddFamily";
import FamilyDetails from "./pages/FamilyDetails";
import AddCitizen from "./pages/AddCitizen";
import CitizenDetails from "./pages/CitizenDetails";
import ServiceList from "./pages/ServiceList";
import ApplyCertificate from "./pages/ApplyCertificate";
import Officials from "./pages/Officials";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />


        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/citizens" element={<CitizenList />} />
          <Route path="/citizens/add" element={<AddCitizen />} />
          <Route path="/citizens/:id" element={<CitizenDetails />} />
          <Route path="/families" element={<Families />} />
          <Route path="/families/add" element={<AddFamily />} />
          <Route path="/families/:id" element={<FamilyDetails />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/apply" element={<ApplyCertificate />} />
          <Route path="/officials" element={<Officials />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
