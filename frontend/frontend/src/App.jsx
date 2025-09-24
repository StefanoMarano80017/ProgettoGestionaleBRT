// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./layouts/ThemeContext";
import Layout from "./layouts/MainLayout";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Milestone from "./Pages/Milestone";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />  
            <Route path="about" element={<About />} />
            <Route path="milestone" element={<Milestone/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
