import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBarChart2, FiCalendar, FiCreditCard, FiDollarSign, FiTrendingUp } from "react-icons/fi";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { getAnalytics, getExpenses } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";
import { groupBy, titleCase, toNumber } from "../utils/finance";

const palette = ["#8b5cf6", "#22c55e", "#f59e0b", "#38bdf8", "#f472b6", "#fb7185", "#14b8a6", "#f97316"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const asDate = (date) => {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime()) ? null : value;
};

export default function Analytics() {
  const { formatMoney } = useCurrency();
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = () => {
    const now = new Date();
    Promise.all([getAnalytics(now.getMonth() + 1, now.getFullYear()), getExpenses()])
      .then(([summary, expenseData]) => {
        setDashboard(summary);
        setExpenses(expenseData.expenses || []);
      })
      .catch((error) => toast.error(error.response?.data?.error || "Analytics could not be loaded"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(loadAnalytics);
    window.addEventListener("smartbudget:budgets-changed", loadAnalytics);
    window.addEventListener("smartbudget:expenses-changed", loadAnalytics);
    return () => {
      window.removeEventListener("smartbudget:budgets-changed", loadAnalytics);
      window.removeEventListener("smartbudget:expenses-changed", loadAnalytics);
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentExpenses = useMemo(() => expenses.filter((expense) => {
    const date = asDate(expense.date);
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }), [expenses, now]);
  const merchantTotals = useMemo(() => groupBy(currentExpenses, (expense) => titleCase(expense.description)), [currentExpenses]);
  const topMerchants = useMemo(() => Object.entries(merchantTotals).sort((a, b) => b[1] - a[1]), [merchantTotals]);
  const dailyTotals = useMemo(() => groupBy(currentExpenses, (expense) => expense.date), [currentExpenses]);
  const highestDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
  const activeDays = Object.keys(dailyTotals).length;
  const weekdayData = useMemo(() => {
    const totals = groupBy(currentExpenses, (expense) => {
      const date = asDate(expense.date);
      return date ? weekdays[(date.getDay() + 6) % 7] : null;
    });
    return weekdays.map((day) => ({ name: day.slice(0, 3), amount: totals[day] || 0 }));
  }, [currentExpenses]);
  const categoryData = useMemo(() => (dashboard?.all_categories || []).map((item, index) => ({ name: item.category, amount: item.total, fill: palette[index % palette.length] })), [dashboard]);
  const paymentData = useMemo(() => (dashboard?.payment_methods || []).map((item) => ({ name: item.payment_method, amount: item.total })), [dashboard]);
  const paymentTotal = paymentData.reduce((sum, item) => sum + item.amount, 0);
  const cashMethods = new Set(["Cash"]);
  const cashTotal = paymentData.filter((item) => cashMethods.has(item.name)).reduce((sum, item) => sum + item.amount, 0);
  const onlineTotal = paymentTotal - cashTotal;
  const monthData = dashboard?.monthly_spending || [];
  const currentMonth = monthData.find((item) => item.month === now.getMonth() + 1 && item.year === now.getFullYear())?.total;
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = monthData.find((item) => item.month === previousDate.getMonth() + 1 && item.year === previousDate.getFullYear())?.total;
  const trend = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null;
  const cards = [
    ["Total analyzed", formatMoney(dashboard?.total_spending), "This month", FiDollarSign],
    ["Average transaction", formatMoney(dashboard?.average_expense), "Per transaction", FiActivity],
    ["Top category", dashboard?.highest_category || "—", "Highest share", FiTrendingUp],
    ["Transactions", dashboard?.transaction_count || 0, "Across your ledger", FiCreditCard],
    ["Top merchant", topMerchants[0] ? `${titleCase(topMerchants[0][0])} · ${formatMoney(topMerchants[0][1])}` : "—", "Highest merchant total", FiCreditCard],
    ["Largest transaction", currentExpenses.length ? `${titleCase(currentExpenses.reduce((max, item) => toNumber(item.amount) > toNumber(max.amount) ? item : max, currentExpenses[0]).description)} · ${formatMoney(Math.max(...currentExpenses.map((item) => toNumber(item.amount))))}` : "—", "Single purchase", FiDollarSign],
    ["Highest spending day", highestDay ? `${new Date(`${highestDay[0]}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${formatMoney(highestDay[1])}` : "—", "Daily total", FiCalendar],
    ["Average daily spend", activeDays ? `${formatMoney(toNumber(dashboard?.total_spending) / activeDays)}/day` : "—", "Active spending days", FiActivity],
    ["Monthly trend", trend == null ? "Insufficient data" : `${trend >= 0 ? "+" : ""}${trend.toFixed(0)}%`, "Compared with prior month", FiTrendingUp],
  ];

  return <div>
    <div className="page-heading"><div><p className="eyebrow">Financial intelligence</p><h1>Analytics</h1><p className="muted">Turn your spending history into clear, useful decisions.</p></div><div className="insight-pill"><span className="status-dot" /> Updated Live</div></div>
    <div className="grid-4 analytics-kpis">{loading ? [1, 2, 3, 4].map((item) => <div className="skeleton" key={item} />) : cards.map(([title, value, caption, Icon]) => <div className="card stat-card card-hover" key={title}><div className="stat-top"><span>{title}</span><span className="stat-icon"><Icon /></span></div><h3>{value}</h3><span className="muted">{caption}</span></div>)}</div>
    <div className="analytics-grid">
      <div className="card chart-card wide-chart"><div className="card-title"><div><h2>Spending trajectory</h2><span>Month-over-month movement</span></div><FiBarChart2 className="chart-accent" /></div>{monthData.length ? <ResponsiveContainer width="100%" height={300}><AreaChart data={monthData}><CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" /><XAxis dataKey="month" tickFormatter={(value) => String(value).padStart(2, "0")} axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip formatter={(value) => formatMoney(value)} /><Area dataKey="total" type="monotone" stroke="#b69aff" strokeWidth={3} fill="#8b5cf633" /></AreaChart></ResponsiveContainer> : <div className="empty-state">No monthly spending history is available yet.</div>}</div>
      <div className="card chart-card"><div className="card-title"><div><h2>Categories</h2><span>All recorded expenses</span></div></div>{categoryData.length ? <><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={4}>{categoryData.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={(value) => formatMoney(value)} /></PieChart></ResponsiveContainer><div className="donut-legend">{categoryData.map((item) => <div className="legend-item" key={item.name}><span><i className="legend-dot" style={{ background: item.fill }} />{item.name}</span><b>{formatMoney(item.amount)}</b></div>)}</div></> : <div className="empty-state">Category data will appear after your first expense.</div>}</div>
      <div className="card chart-card"><div className="card-title"><div><h2>Weekday spending</h2><span>Current month</span></div></div><ResponsiveContainer width="100%" height={230}><BarChart data={weekdayData}><CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => formatMoney(value)} /><Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="card chart-card"><div className="card-title"><div><h2>Payment mix</h2><span>By available payment method</span></div></div>{paymentData.length ? <ResponsiveContainer width="100%" height={230}><BarChart data={paymentData} layout="vertical"><CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={90} /><Tooltip formatter={(value) => formatMoney(value)} /><Bar dataKey="amount" fill="#22c55e" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer> : <div className="empty-state">Payment mix will appear here.</div>}</div>
    </div>
    <div className="analytics-lists">
      <div className="card list-card"><div className="card-title"><div><h2>Top 5 merchants</h2><span>Ranked by current-month spending</span></div></div>{topMerchants.slice(0, 5).map(([merchant, amount], index) => <div className="list-row" key={merchant}><span>{index + 1}. {merchant}</span><b>{formatMoney(amount)}</b></div>)}</div>
      <div className="card list-card"><div className="card-title"><div><h2>Recurring merchants</h2><span>Merchants with repeated transactions</span></div></div>{Object.entries(groupBy(currentExpenses, (expense) => titleCase(expense.description))).filter(([merchant]) => currentExpenses.filter((expense) => titleCase(expense.description) === merchant).length > 1).map(([merchant, amount]) => <div className="list-row" key={merchant}><span>{merchant}<small>{currentExpenses.filter((expense) => titleCase(expense.description) === merchant).length} transactions</small></span><b>{formatMoney(amount)}</b></div>)}</div>
      <div className="card list-card"><div className="card-title"><div><h2>Cash vs online</h2><span>Share of available payment data</span></div></div>{paymentTotal ? <><div className="list-row"><span>Cash</span><b>{((cashTotal / paymentTotal) * 100).toFixed(0)}%</b></div><div className="list-row"><span>Online</span><b>{((onlineTotal / paymentTotal) * 100).toFixed(0)}%</b></div></> : <div className="empty-state">Payment data will appear after your first expense.</div>}</div>
      <div className="card list-card"><div className="card-title"><div><h2>Time of day</h2><span>Requires timestamps</span></div></div><div className="empty-state">Your expense records contain dates but no times, so time-of-day spending cannot be calculated yet.</div></div>
    </div>
  </div>;
}
