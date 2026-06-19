import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BoxDetail } from "./pages/BoxDetail";
import { GardenMap } from "./pages/GardenMap";
import { Seedlings } from "./pages/Seedlings";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GardenMap />} />
        <Route path="/box/:id" element={<BoxDetail />} />
        <Route path="/seedlings" element={<Seedlings />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
