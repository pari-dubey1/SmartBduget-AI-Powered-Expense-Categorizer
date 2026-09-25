import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiChevronDown, FiCommand, FiMenu, FiSearch, FiSettings, FiUser } from "react-icons/fi";
import "../styles/navbar.css";
import { useCurrency } from "../context/CurrencyContext";

export default function Navbar({ onMenu }) {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null); const profileRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  return <header className="topbar">
    <button className="icon-btn menu-toggle" aria-label="Open navigation" onClick={onMenu}><FiMenu /></button>
    <div className="search-box"><FiSearch /><input aria-label="Search transactions" placeholder="Search transactions..." /><kbd><FiCommand /> K</kbd></div>
    <div className="top-actions">
      <div className="currency-menu"><button className="top-control" aria-expanded={currencyOpen} onClick={() => setCurrencyOpen((value) => !value)}><span className="currency-symbol">{currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}</span>{currency}<FiChevronDown /></button>{currencyOpen && <div className="dropdown-menu">{["INR", "USD", "EUR"].map((item) => <button key={item} className={currency === item ? "selected" : ""} onClick={() => { setCurrency(item); setCurrencyOpen(false); }}>{item === "INR" ? "₹ Indian Rupee" : item === "USD" ? "$ US Dollar" : "€ Euro"}</button>)}</div>}</div>
      <div className="notification-menu" ref={notificationRef}><button className="icon-btn notification" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}><FiBell />{!notificationsOpen && <i />}</button>{notificationsOpen && <div className="dropdown-menu notification-popover"><b>Notifications</b><p><strong>Expense added</strong><span>AI categorized your latest purchase</span></p><p><strong>Budget alert</strong><span>Food budget is nearing its limit</span></p><p><strong>Forecast updated</strong><span>Your month-end outlook is ready</span></p></div>}</div>
      <div className="profile-menu" ref={profileRef}><button className="user-chip" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}><div className="avatar">P</div><div><b>Pari Dubey</b><span>Personal account</span></div><FiChevronDown /></button>{profileOpen && <div className="dropdown-menu profile-popover"><Link to="/profile" onClick={() => setProfileOpen(false)}><FiUser /> Profile</Link><Link to="/settings" onClick={() => setProfileOpen(false)}><FiSettings /> Settings</Link><Link to="/profile" onClick={() => setProfileOpen(false)}><FiUser /> My account</Link></div>}</div>
    </div>
  </header>;
}
