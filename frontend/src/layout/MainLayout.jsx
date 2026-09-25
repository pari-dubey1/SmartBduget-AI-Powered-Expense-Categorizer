import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/app.css";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  return (
    <div className="app-shell">
      <AnimatePresence>{sidebarOpen && <motion.button aria-label="Close navigation" className="sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />}</AnimatePresence>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar onMenu={() => setSidebarOpen(true)} />
        <AnimatePresence mode="wait"><motion.main className="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}><Outlet /></motion.main></AnimatePresence>
      </div>
    </div>
  );
}
