import { useEffect, useState } from "react";
import { FiArrowUpRight, FiCalendar, FiInfo, FiTrendingUp } from "react-icons/fi";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { getMonthlyPrediction, getMonthlySpending } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

export default function Forecast() {
  const { formatMoney } = useCurrency();
  const money = formatMoney;
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadForecast = () => {
    const now = new Date();
    Promise.all([getMonthlyPrediction(now.getMonth() + 1, now.getFullYear()), getMonthlySpending()])
      .then(([forecast, monthly]) => { setPrediction(forecast); setHistory(monthly.monthly_spending || []); })
      .catch((error) => toast.error(error.response?.data?.error || "Forecast could not be loaded"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadForecast();
    window.addEventListener("smartbudget:budgets-changed", loadForecast);
    return () => window.removeEventListener("smartbudget:budgets-changed", loadForecast);
  }, []);
  const chartData = [...history, ...(prediction ? [{ month: "Forecast", total: prediction.predicted_month_end }] : [])];
  return <div><div className="page-heading"><div><p className="eyebrow">Predictive intelligence</p><h1>Your spending forecast</h1><p className="muted">See where this month is heading before it gets there.</p></div><div className="insight-pill"><FiCalendar /> Updated from current month</div></div>
    {loading ? <><div className="grid-4">{[1,2,3].map((item) => <div className="skeleton" key={item} />)}</div><div className="card chart-card forecast-loading skeleton" /></> : prediction ? <>    <div className="grid-4"><div className="card stat-card card-hover forecast-primary"><div className="stat-top"><span>Predicted month-end</span><span className="stat-icon"><FiTrendingUp /></span></div><h3>{money(prediction.predicted_month_end)}</h3><span className="trend">Projection: {prediction.prediction_method.replaceAll("_", " ")}</span></div><div className="card stat-card card-hover"><div className="stat-top"><span>Current spending</span></div><h3>{money(prediction.current_spending)}</h3><span className="muted">Observed this month</span></div><div className="card stat-card card-hover"><div className="stat-top"><span>{prediction.predicted_month_end > prediction.total_budget ? "Expected Overspend" : "Expected Savings"}</span></div><h3>{prediction.total_budget > 0 ? money(Math.abs(prediction.predicted_month_end - prediction.total_budget)) : "No monthly budget configured"}</h3><span className="muted">{prediction.total_budget > 0 ? (prediction.predicted_month_end > prediction.total_budget ? "Above tracked budget" : "Below tracked budget") : "Create a budget to project savings"}</span></div><div className="card stat-card card-hover"><div className="stat-top"><span>Remaining Budget</span></div><h3>{prediction.total_budget > 0 ? money(prediction.remaining_budget) : "No monthly budget configured"}</h3><span className="muted">{prediction.total_budget > 0 ? "Budget less current spending" : "Create a budget to track remaining funds"}</span></div></div><div className="grid-2 forecast-layout"><div className="card chart-card"><div className="card-title"><div><h2>Actuals vs projection</h2><span>Historical spending with forecast marker</span></div><FiArrowUpRight className="chart-accent" /></div><ResponsiveContainer width="100%" height={300}><AreaChart data={chartData}><defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#22c55e" stopOpacity=".32" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#778197", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#778197", fontSize: 11 }} /><Tooltip formatter={(value) => money(value)} contentStyle={{ background: "#181b27", border: "1px solid #303448", borderRadius: 12 }} /><Area dataKey="total" type="monotone" stroke="#4ade80" fill="url(#forecastFill)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div><div className="card list-card forecast-note"><div className="card-title"><h2>How to read this</h2><FiInfo className="chart-accent" /></div><p className="muted">Your forecast uses your current spending, recent transaction behavior and historical monthly averages.</p><div className="list-row"><span>Current pace</span><b>{money(prediction.current_spending)}</b></div><div className="list-row"><span>Estimated month end</span><b>{money(prediction.predicted_month_end)}</b></div><div className="forecast-callout">Small changes this week can have a meaningful impact on your final number.</div></div></div></> : <div className="card empty-state">There is not enough history to build a forecast yet.</div>}</div>;
}
