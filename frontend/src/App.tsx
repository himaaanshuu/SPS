import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import NetworkBackground from "./components/NetworkBackground";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Predict from "./pages/Predict";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import SkillGap from "./pages/SkillGap";
import Model from "./pages/Model";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NetworkBackground />
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/skill-gap" element={<SkillGap />} />
            <Route path="/model" element={<Model />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
