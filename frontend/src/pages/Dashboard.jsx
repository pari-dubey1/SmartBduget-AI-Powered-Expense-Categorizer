import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCreditCard, FiDollarSign, FiPlus, FiTarget, FiTrendingUp, FiZap } from "react-icons/fi";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { getBudgets, getDashboardSummary, getExpenses, getMonthlyPrediction, getSavingsInsights } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

const colors = ["#8b5cf6", "#22c55e", "#f59e0b", "#38bdf8", "#f87171", "#ec4899"];
function AnimatedMetric({ value, formatMoney }) {
  const numeric = typeof value === "number" || /^\D?[\d,.]+$/.test(String(value));
  const [display, setDisplay] = useState(numeric ? 0 : value);
  useEffect(() => {
    if (!numeric) return undefined;
    const target = Number(String(value).replace(/[^\d.-]/g, ""));
    let frame;
    const started = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - started) / 650, 1);
      setDisplay(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric, value]);
  return numeric && typeof value === "string" && value.includes("¤") ? formatMoney(display) : numeric ? Number(display).toLocaleString("en-IN") : value;
}

export default function Dashboard() {
  const { formatMoney } = useCurrency();
  const money = formatMoney;
  const [data, setData] = useState(null); const [expenses, setExpenses] = useState([]); const [monthly, setMonthly] = useState([]); const [categories, setCategories] = useState([]); const [budgets, setBudgets] = useState([]); const [prediction, setPrediction] = useState(null); const [saving, setSaving] = useState(null); const [error, setError] = useState("");
  const loadDashboard = () => {
    const now = new Date();
    Promise.all([getDashboardSummary(now.getMonth() + 1, now.getFullYear()), getExpenses()])
      .then(([summary, expenseData]) => {
        setData(summary); setExpenses(expenseData.expenses || []); setMonthly(summary.monthly_spending || []); setCategories(summary.categories || []);
        return Promise.allSettled([getBudgets(now.getMonth() + 1, now.getFullYear()), getMonthlyPrediction(now.getMonth() + 1, now.getFullYear()), getSavingsInsights()]);
      })
      .then((optional) => {
        if (!optional) return;
        if (optional[0].status === "fulfilled") setBudgets(optional[0].value.budgets || []);
        if (optional[1].status === "fulfilled") setPrediction(optional[1].value);
        if (optional[2].status === "fulfilled") setSaving(optional[2].value);
      })
      .catch((e) => { setError(e.response?.data?.error || "Unable to load your financial overview."); toast.error(e.response?.data?.error || "Could not connect to SmartBudget API"); });
  };
  useEffect(() => {
    loadDashboard();
    window.addEventListener("smartbudget:budgets-changed", loadDashboard);
    return () => window.removeEventListener("smartbudget:budgets-changed", loadDashboard);
  }, []);
  const categoryData = useMemo(() => categories.map((item, index) => ({ name: item.category || item.name, value: Number(item.amount || item.total || 0), color: colors[index % colors.length] })), [categories]);
  const stats = data ? [["Total spending", `¤${data.total_spending}`, "This month", FiDollarSign], ["Average expense", `¤${data.average_expense}`, "Per transaction", FiTrendingUp], ["Top category", data.highest_category || "—", "Highest spend", FiTarget], ["Transactions", data.transaction_count || 0, "This month", FiCreditCard]] : [];
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const greeting = today.getHours() < 12 ? "Good Morning" : today.getHours() < 17 ? "Good Afternoon" : "Good Evening";
  const todaySpend = expenses.filter((expense) => expense.date === today.toISOString().slice(0, 10)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const budgetLimit = budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0);
  const budgetHealth = budgetLimit ? Math.round((Number(data?.total_spending || 0) / budgetLimit) * 100) : 0;
  const topCategory = categories[0]?.category || "your top category";
  return <div className="dashboard-page">
    <div className="page-heading"><div><p className="eyebrow">{dateLabel}</p><h1>{greeting}, Pari <span className="gradient-text">👋</span></h1><p className="muted">Here's your financial overview for this month.</p></div><div className="hero-actions"><Link className="btn btn-ghost" to="/analytics">View reports <FiArrowUpRight /></Link><Link className="btn btn-primary" to="/add-expense"><FiPlus /> Add expense</Link></div></div>
    {error && <div className="error-state card">{error}</div>}
    <div className="grid-4">{data ? stats.map(([label,value,caption,Icon], index) => <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className="card stat-card card-hover" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon /></span></div><h3><AnimatedMetric value={value} formatMoney={formatMoney} /></h3><span className="trend">↗ {caption}</span></motion.div>) : [1,2,3,4].map((x)=><div className="skeleton" key={x}/>)}</div>
    <div className="dashboard-story">
      <motion.div className="card story-card card-hover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }}><div className="story-label"><span>Today's spending</span><span className="story-icon"><FiCreditCard /></span></div><h3>{formatMoney(todaySpend)}</h3><p><strong>{todaySpend ? "Active spending day" : "No spending recorded today"}</strong> · compared with your monthly rhythm</p></motion.div>
      <motion.div className="card story-card card-hover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .28 }}><div className="story-label"><span>Budget health</span><span className="story-icon"><FiTarget /></span></div><h3>{budgetLimit ? `${Math.min(budgetHealth, 100)}%` : "—"}</h3><p>{budgetLimit ? (budgetHealth <= 80 ? "On track for this month" : "Review your remaining budget") : "Create a budget to track progress"}</p></motion.div>
      <motion.div className="card story-card recommendation card-hover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .34 }}><div className="story-label"><span>Smart recommendation</span><span className="story-icon"><FiZap /></span></div><p><b>Keep an eye on {topCategory}.</b> Your spending pattern is ready for a small, intentional adjustment.</p><Link className="muted" to="/insights">Open insights <FiArrowUpRight /></Link></motion.div>
    </div>
    <div className="grid-2 dashboard-charts"><div className="card chart-card"><div className="card-title"><h2>Spending activity</h2><span>Monthly overview</span></div>{monthly.length ? <ResponsiveContainer width="100%" height={270}><AreaChart data={monthly}><defs><linearGradient id="spend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".45"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#737b8e",fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#737b8e",fontSize:11}}/><Tooltip contentStyle={{background:"#181b27",border:"1px solid #303448",borderRadius:10,color:"#fff"}}/><Area type="monotone" dataKey="total" stroke="#a78bfa" fill="url(#spend)" strokeWidth={3} /></AreaChart></ResponsiveContainer> : <div className="empty-state">No monthly spending data yet.</div>}</div>
      <div className="card chart-card"><div className="card-title"><h2>Expense categories</h2><span>This month</span></div>{categoryData.length ? <><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={57} outerRadius={80} paddingAngle={4}>{categoryData.map((entry)=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{background:"#181b27",border:"1px solid #303448",borderRadius:10}}/></PieChart></ResponsiveContainer><div className="donut-legend">{categoryData.slice(0,4).map((item,index)=><div className="legend-item" key={item.name}><span><i className={`legend-dot dot-${index}`} />{item.name}</span><b>{money(item.value)}</b></div>)}</div></> : <div className="empty-state">No category data yet.</div>}</div></div>
    <div className="card list-card"><div className="card-title"><h2>Recent transactions</h2><Link className="muted" to="/expenses">View all <FiArrowUpRight /></Link></div>{expenses.length ? <div className="table-wrap"><table><thead><tr><th>Description</th><th>Category</th><th>Payment</th><th>Date</th><th>Amount</th></tr></thead><tbody>{expenses.slice(0,5).map((expense)=><tr key={expense.id}><td><div className="transaction-name"><span className="transaction-icon"><FiCreditCard /></span><span><b>{expense.description}</b><span>Transaction #{expense.id}</span></span></div></td><td><span className="badge">{expense.category}</span></td><td>{expense.payment_method}</td><td>{expense.date}</td><td><b>{money(expense.amount)}</b></td></tr>)}</tbody></table></div> : <div className="empty-state">Your recent transactions will appear here.</div>}</div>
    <div className="dashboard-lower"><div className="card list-card"><div className="card-title"><div><h2>Budget overview</h2><span>This month</span></div><Link className="muted" to="/budgets">Manage <FiArrowUpRight /></Link></div>{budgets.length ? budgets.slice(0,3).map((budget) => <div className="budget-row" key={budget.id}><div><b>{budget.category}</b><small>{money(budget.amount)} limit</small></div><div className="budget-bar"><span style={{ width: "42%" }} /></div><strong>42%</strong></div>) : <div className="empty-state">Create a budget to see your progress here.</div>}</div><div className="card list-card dashboard-ai"><div className="card-title"><div><h2>Smart signals</h2><span>Personalized for you</span></div><FiZap className="chart-accent" /></div><div className="signal-number">{saving?.potential_saving ? money(saving.potential_saving) : money(prediction?.expected_remaining_spending)}<small>{saving?.potential_saving ? "potential monthly saving" : "expected remaining"}</small></div><p className="muted">{saving?.message || "Your forecast is ready. Keep an eye on your pace this month."}</p><Link className="btn btn-ghost" to="/insights">Explore insights <FiArrowUpRight /></Link></div></div>
  </div>;
}
