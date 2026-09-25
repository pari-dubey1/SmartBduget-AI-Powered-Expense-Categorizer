import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Forecast = lazy(() => import("./pages/Forecast"));
const Insights = lazy(() => import("./pages/Insights"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return <BrowserRouter><Suspense fallback={<div className="route-loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>}><Routes><Route path="/" element={<MainLayout />}>
    <Route index element={<Dashboard />} /><Route path="expenses" element={<Expenses />} />
    <Route path="add-expense" element={<AddExpense />} /><Route path="budgets" element={<Budgets />} />
    <Route path="analytics" element={<Analytics />} /><Route path="forecast" element={<Forecast />} />
    <Route path="insights" element={<Insights />} /><Route path="profile" element={<Profile />} />
    <Route path="settings" element={<Settings />} />
  </Route><Route path="*" element={<NotFound />} /></Routes></Suspense></BrowserRouter>;
}
