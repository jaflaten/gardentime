import { BrowserRouter, Routes, Route } from "react-router-dom";
import Overview from './pages/Overview';
import Layout from './pages/Layout.tsx';
import GardensListView from './pages/Gardens';
import NoPage from './pages/NoPage';
import {GardenView} from "./components/GardenView.tsx";
import {GrowZoneView} from "./components/GrowZoneView.tsx";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="gardens" element={<GardensListView />} />
          <Route path="/garden/:gardenId" element={<GardenView />} />
          <Route path="/growarea/:growzoneId" element={<GrowZoneView />} />

          {/*<Route path="/cropRecord/:cropRecordId" element={<GardenPage />} />*/}

          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
