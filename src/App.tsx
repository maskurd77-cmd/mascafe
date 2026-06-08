import SubscriptionLock from "./components/SubscriptionLock";

function App() {
  return (
    <div>
      <SubscriptionLock /> {/* ئەمە لە سەرەوەی هەموو لۆجیکەکان بێت */}
      <YourMainApp />
    </div>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Menu from './pages/Menu';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
