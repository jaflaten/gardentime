import { BrowserRouter, Routes, Route } from "react-router-dom";
import Overview from './pages/Overview';
import Layout from './pages/Layout.tsx';
import Gardens from './pages/Gardens';
import NoPage from './pages/NoPage';
import {GardenPage} from "./components/GardenPage.tsx";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="gardens" element={<Gardens />} />
          <Route path="/garden/:gardenId" element={<GardenPage />} />

          {/*<Route path="/cropRecord/:cropRecordId" element={<GardenPage />} />*/}

          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
