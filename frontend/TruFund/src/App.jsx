import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CampaignerRegister from "./pages/CampaignerRegister";
import DonorDashboard from "./pages/DonorDashboard";
import CampaignDetail from "./pages/CampaignDetail";
import CampaignerDashboard from "./pages/CampaignerDashboard";
import BoardDashboard from "./pages/BoardDashboard";
import Navbar from "./components/Navbar";
import BoardHome from "./pages/BoardHome";
import WelcomeModal from "./components/WelcomeModal";
import { useState, useEffect } from "react";

function App() {
   const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // show modal only if user hasn't agreed before
        const agreed = localStorage.getItem("givtru_agreed");
        if (!agreed) setShowWelcome(true);
    }, []);

    const handleAgree = () => {
        localStorage.setItem("givtru_agreed", "true");
        setShowWelcome(false);
    };
  return (
    <>
    {showWelcome && <WelcomeModal onAgree={handleAgree} />}
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                      element={<Landing />} />
        <Route path="/register"              element={<CampaignerRegister />} />
        <Route path="/donate"                element={<DonorDashboard />} />
        <Route path="/campaign/:address"     element={<CampaignDetail />} />
        <Route path="/dashboard"             element={<CampaignerDashboard />} />
        <Route path="/board/:address"        element={<BoardDashboard />} />
        <Route path="/board-home" element={<BoardHome />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;