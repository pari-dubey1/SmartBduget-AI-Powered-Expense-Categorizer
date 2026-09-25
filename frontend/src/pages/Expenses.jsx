import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiEdit2, FiFileText, FiFilter, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { deleteExpense, getCategories, getExpenses, notifyExpenseChanged, updateExpense } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

const pageSize = 7;
const titleCase = (description = "") => description.replace(/\b\w/g, (character) => character.toUpperCase());

export default function Expenses() {
  const { formatMoney } = useCurrency();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [supportedCategories, setSupportedCategories] = useState([]);

  const load = () => getExpenses()
    .then((data) => setItems(data.expenses || []))
    .catch((error) => toast.error(error.response?.data?.error || "Unable to load expenses"))
    .finally(() => setLoading(false));
  useEffect(() => { load(); getCategories().then((data) => setSupportedCategories(data.categories || [])).catch((error) => console.error("[SmartBudget] Category load failed", error)); }, []);

  const categories = useMemo(() => ["All categories", ...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const matchesQuery = `${item.description} ${item.category} ${item.payment_method}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery && (category === "All categories" || item.category === category);
    });
    return [...result].sort((a, b) => sort === "amount" ? Number(b.amount) - Number(a.amount) : sort === "oldest" ? String(a.date).localeCompare(String(b.date)) : String(b.date).localeCompare(String(a.date)));
  }, [items, query, category, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const remove = async (id) => {
    try { await deleteExpense(id); setItems((current) => current.filter((item) => item.id !== id)); notifyExpenseChanged(); toast.success("Expense deleted"); }
    catch (error) { toast.error(error.response?.data?.error || "Could not delete expense"); }
  };
  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      const response = await updateExpense(editing.id, { ...editing, amount: Number(editing.amount) });
      setItems((current) => current.map((item) => item.id === editing.id ? (response.expense || editing) : item));
      setEditing(null); notifyExpenseChanged(); toast.success("Expense updated");
    } catch (error) { toast.error(error.response?.data?.error || "Could not update expense"); }
  };

  return <div>
    <div className="page-heading"><div><p className="eyebrow">Ledger</p><h1>Expenses</h1><p className="muted">Search, review and manage every transaction.</p></div><a className="btn btn-primary" href="/add-expense">Add expense</a></div>
    <div className="card list-card">
      <div className="toolbar expense-toolbar"><div className="search-box"><FiSearch /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search descriptions, categories..." /></div><div className="filter-group"><FiFilter /><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount">Highest amount</option></select></div><span className="muted">{filteredItems.length} transactions</span></div>
      {loading ? <div className="table-skeleton">{[1, 2, 3, 4, 5].map((item) => <div className="skeleton-row" key={item} />)}</div> : visibleItems.length ? <div className="table-wrap"><table><thead><tr><th>Description</th><th>Category</th><th>Payment method</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><div className="transaction-name"><span className="merchant-icon"><FiFileText /></span><span><b>{titleCase(item.description)}</b><span>Transaction #{item.id}</span></span></div></td><td><span className={`badge category-${String(item.category || "other").toLowerCase()}`}>{item.category || "Uncategorized"}</span></td><td>{item.payment_method}</td><td>{item.date}</td><td><b className="amount-positive">{formatMoney(item.amount)}</b></td><td><span className="status-badge">Completed</span></td><td><div className="row-actions"><button className="icon-btn" onClick={() => setEditing({ ...item })} aria-label="Edit expense"><FiEdit2 /></button><button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="Delete expense"><FiTrash2 /></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state illustrated-empty"><span>🧾</span><h3>No expenses yet</h3><p>Add your first expense to begin tracking.</p><a className="btn btn-primary" href="/add-expense">Add expense</a></div>}
      {!loading && filteredItems.length > pageSize && <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}</span><div><button className="icon-btn" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><FiChevronLeft /></button><b>{page} / {pageCount}</b><button className="icon-btn" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><FiChevronRight /></button></div></div>}
    </div>
    {editing && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}><form className="card edit-modal" onSubmit={saveEdit}><div className="card-title"><h2>Edit expense</h2><button type="button" className="icon-btn" onClick={() => setEditing(null)}><FiX /></button></div><div className="field-grid"><div className="field"><label htmlFor="edit-amount">Amount</label><input id="edit-amount" type="number" min="1" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: event.target.value })} required /></div><div className="field"><label htmlFor="edit-date">Date</label><input id="edit-date" type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} required /></div><div className="field full"><label htmlFor="edit-description">Description</label><input id="edit-description" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} required /></div><div className="field"><label htmlFor="edit-category">Category</label><select id="edit-category" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{supportedCategories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="edit-payment">Payment method</label><select id="edit-payment" value={editing.payment_method} onChange={(event) => setEditing({ ...editing, payment_method: event.target.value })}><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Wallet</option><option>Net Banking</option></select></div></div><button className="btn btn-primary">Save changes</button></form></div>}
  </div>;
}
