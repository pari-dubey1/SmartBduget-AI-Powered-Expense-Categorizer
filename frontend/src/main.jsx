import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./styles/global.css";
import { Toaster } from "react-hot-toast";
import { CurrencyProvider } from "./context/CurrencyContext";

localStorage.removeItem("smartbudget-theme");
document.documentElement.removeAttribute("data-theme");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider><App /><Toaster position="top-right" toastOptions={{ style: { background: "#1b1e2a", color: "#fff" } }} /></CurrencyProvider>
  </StrictMode>,
)
