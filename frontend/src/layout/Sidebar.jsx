import { NavLink } from "react-router-dom";
import {
  FiActivity, FiBarChart2, FiCalendar, FiChevronRight, FiCreditCard,
  FiHome, FiPieChart, FiPlus, FiSettings, FiTarget, FiUser, FiX, FiHeart,
} from "react-icons/fi";
import "../styles/sidebar.css";

const menu = [
  ["Dashboard", "/", FiHome], ["Expenses", "/expenses", FiCreditCard],
  ["Add Expense", "/add-expense", FiPlus], ["Budgets", "/budgets", FiTarget],
  ["Analytics", "/analytics", FiBarChart2], ["AI Insights", "/insights", FiActivity],
  ["Forecast", "/forecast", FiCalendar],
];
const secondary = [["Profile", "/profile", FiUser], ["Settings", "/settings", FiSettings]];

export default function Sidebar({ open, onClose }) {
  const links = (items) => items.map(([label, path, Icon]) => (
    <NavLink key={path} to={path} end={path === "/"} onClick={onClose}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
      <Icon /><span>{label}</span>{label === "AI Insights" && <small>NEW</small>}
    </NavLink>
  ));
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand-row"><div className="brand-mark"><FiPieChart /></div><div><strong>SmartBudget</strong><span>AI expense manager</span></div><button aria-label="Close navigation" className="icon-btn mobile-close" onClick={onClose}><FiX /></button></div>
      <p className="nav-label">Workspace</p><nav>{links(menu)}</nav>
      <p className="nav-label">Account</p><nav>{links(secondary)}</nav>
      <div className="storage-card goal-card"><div className="storage-head"><span><FiHeart /> Monthly goal</span><b>68%</b></div><div className="progress"><i /></div><p><strong>₹12,300</strong> of ₹18,000 used this month.</p><span className="goal-status">On track <FiChevronRight /></span></div>
      <div className="sidebar-footer"><span className="status-dot" /> All systems operational</div>
    </aside>
  );
}
