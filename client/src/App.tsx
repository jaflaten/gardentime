import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Overview from './pages/Overview';
import Wrapper from './pages/Wrapper';
import Gardens from './pages/Gardens';
import NoPage from './pages/NoPage';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Wrapper />}>
          <Route index element={<Overview />} />
          <Route path="gardens" element={<Gardens />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
