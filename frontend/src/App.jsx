import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Workspace from "./components/Workspace.jsx";
import History from "./components/History.jsx";
import BrandGuidelines from "./components/BrandGuidelines.jsx";

export default function App() {
  const [dark, setDark] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  const renderView = () => {
    if (activeView === "brand") return <BrandGuidelines />;
    if (activeView === "history") return <History />;
    if (activeView === "dashboard") return <Hero onStart={() => setActiveView("image")} />;
    return <Workspace />;
  };

  return (
    <div className={`app${dark ? "" : " light"}`}>
      <Navbar dark={dark} setDark={setDark} activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">{renderView()}</main>
    </div>
  );
}
