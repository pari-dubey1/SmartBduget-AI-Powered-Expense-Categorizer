import { useCallback, useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { addBudget, deleteBudget, getBudgets, getCategories, getExpenses, notifyBudgetChanged, updateBudget } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";
import { spendingForBudget } from "../utils/finance";

const initialForm = (date = new Date()) => ({
  category: "",
  amount: "",
  month: date.getMonth() + 1,
  year: date.getFullYear(),
});

export default function Budgets() {
  const { formatMoney } = useCurrency();
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, expenseData] = await Promise.all([getBudgets(), getExpenses()]);
      setBudgets(data.budgets || []);
      setExpenses(expenseData.expenses || []);
    } catch (error) {
      console.error("[SmartBudget] Budget load failed", error);
      toast.error(error.response?.data?.error || "Unable to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
    Promise.all([getCategories(), getExpenses()])
      .then(([data, expenseData]) => {
        const detected = (expenseData.expenses || []).map((expense) => expense.category).filter(Boolean);
        const available = [...new Set([...(data.categories || []), ...detected])].sort();
        setCategories(available);
        setForm((current) => ({ ...current, category: current.category || available[0] || "" }));
      })
      .catch((error) => {
        console.error("[SmartBudget] Category load failed", error);
        toast.error(error.response?.data?.error || "Categories could not be loaded");
      });
    return () => {
      window.removeEventListener("smartbudget:budgets-changed", load);
      window.removeEventListener("smartbudget:expenses-changed", load);
    };
  }, [load]);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      category: form.category,
      amount: Number(form.amount),
      month: Number(form.month),
      year: Number(form.year),
    };
    try {
      if (editing) {
        await updateBudget(editing.id, payload);
        toast.success("Budget updated");
      } else {
        await addBudget(payload);
        toast.success("Budget created");
      }
      setEditing(null);
      setForm({ ...initialForm(), category: categories[0] || "" });
      await       Promise.resolve().then(load);
      window.addEventListener("smartbudget:budgets-changed", load);
      window.addEventListener("smartbudget:expenses-changed", load);
      notifyBudgetChanged();
    } catch (error) {
      console.error("[SmartBudget] Budget save failed", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(error.response?.data?.error || "Could not save budget");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (budget) => {
    setEditing(budget);
    setForm({
      category: budget.category,
      amount: String(budget.amount),
      month: budget.month,
      year: budget.year,
    });
  };

  const remove = async (budget) => {
    if (!window.confirm(`Delete the ${budget.category} budget for ${budget.month}/${budget.year}?`)) return;
    try {
      await deleteBudget(budget.id);
      setBudgets((current) => current.filter((item) => item.id !== budget.id));
      toast.success("Budget deleted");
      notifyBudgetChanged();
    } catch (error) {
      console.error("[SmartBudget] Budget deletion failed", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(error.response?.data?.error || "Could not delete budget");
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...initialForm(), category: categories[0] || "" });
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Plan ahead</p>
          <h1>Budgets</h1>
          <p className="muted">Keep your spending intentional, category by category.</p>
        </div>
      </div>
      <form className="card budget-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="category">{editing ? "Edit category" : "Category"}</label>
          <select id="category" name="category" value={form.category} onChange={update} required disabled={!categories.length}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Monthly limit</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={update} required placeholder="e.g. 12000" />
        </div>
        <div className="field">
          <label htmlFor="month">Month</label>
          <input id="month" name="month" type="number" min="1" max="12" value={form.month} onChange={update} required />
        </div>
        <div className="field">
          <label htmlFor="year">Year</label>
          <input id="year" name="year" type="number" min="2000" value={form.year} onChange={update} required />
        </div>
        <div className="form-footer">
          {editing && <button type="button" className="btn btn-ghost" onClick={cancelEdit}><FiX /> Cancel</button>}
          <button className="btn btn-primary" disabled={saving || !categories.length}>
            {editing ? <FiEdit2 /> : <FiPlus />} {saving ? "Saving..." : editing ? "Save changes" : "Create budget"}
          </button>
        </div>
      </form>
      <div className="budget-grid">
        {loading ? <div className="card empty-state">Loading budgets...</div> : budgets.length ? budgets.map((item) => (
          <div className="card list-card card-hover" key={item.id}>
            {(() => {
              const spent = spendingForBudget(expenses, item);
              const percentage = item.amount > 0 ? (spent / item.amount) * 100 : 0;
              const tone = percentage < 60 ? "good" : percentage <= 80 ? "warn" : percentage <= 100 ? "high" : "over";
              return <div className={`budget-progress-content ${tone}`}>
            <div className="card-title"><h2>{item.category}</h2><span>{item.month}/{item.year}</span></div>
            <h3>{formatMoney(spent)} <small>/ {formatMoney(item.amount)}</small></h3>
            <div className="progress"><i style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
            <div className="budget-metrics"><b>{percentage.toFixed(0)}% used</b><span>Remaining: {formatMoney(Math.max(item.amount - spent, 0))}</span></div>
            <div className="row-actions">
              <button className="icon-btn" onClick={() => startEdit(item)} aria-label={`Edit ${item.category} budget`}><FiEdit2 /></button>
              <button className="icon-btn danger" onClick={() => remove(item)} aria-label={`Delete ${item.category} budget`}><FiTrash2 /></button>
            </div>
              </div>;
            })()}
          </div>
        )) : <div className="card empty-state">No budgets configured yet.</div>}
      </div>
    </div>
  );
}
