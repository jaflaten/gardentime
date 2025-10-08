import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Overview from './pages/Overview';
import Layout from './pages/Layout.tsx';
import GardensListView from './pages/Gardens';
import NoPage from './pages/NoPage';
import Login from './pages/Login';
import Register from './pages/Register';
import {GardenView} from "./components/GardenView.tsx";
import {GrowZoneView} from "./components/GrowZoneView.tsx";

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="gardens" element={<GardensListView />} />
            <Route path="/garden/:gardenId" element={<GardenView />} />
            <Route path="/growarea/:growzoneId" element={<GrowZoneView />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
