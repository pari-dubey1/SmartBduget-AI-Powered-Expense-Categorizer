import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.error("[SmartBudget] VITE_API_BASE_URL is not configured.");
}

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
    console.error("[SmartBudget API]", {
      method: error.config?.method?.toUpperCase(),
      url: requestUrl,
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const unwrap = async (requestFactory, attempts = 2) => {
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      const { data } = await requestFactory();
      return data;
    } catch (error) {
      const shouldRetry = !error.response && attempt < attempts;
      if (!shouldRetry) throw error;
      await sleep(500 * (attempt + 1));
    }
  }
  throw new Error("Request failed");
};
const normalizeDashboard = (data) => ({
  ...data,
  highest_category: data.highest_category?.category || data.highest_category || null,
  categories: data.categories || [],
  all_categories: data.all_categories || data.categories || [],
  monthly_spending: data.monthly_spending || [],
});

export const notifyBudgetChanged = () => {
  window.dispatchEvent(new CustomEvent("smartbudget:budgets-changed"));
};
export const notifyExpenseChanged = () => {
  window.dispatchEvent(new CustomEvent("smartbudget:expenses-changed"));
};

export const getDashboardSummary = (month, year) =>
  unwrap(() => api.get("/api/dashboard", { params: { month, year } })).then(normalizeDashboard);
export const getCategorySummary = (month, year) =>
  unwrap(() => api.get("/api/dashboard/category", { params: { month, year } }));
export const getMonthlySpending = () => unwrap(() => api.get("/api/dashboard/monthly"));
export const getExpenses = () => unwrap(() => api.get("/api/expenses"));
export const getCategories = () => unwrap(() => api.get("/api/categories"));
export const addExpense = (payload) => unwrap(() => api.post("/api/expenses", payload));
export const updateExpense = (id, payload) =>
  unwrap(() => api.put(`/api/expenses/${id}`, payload));
export const deleteExpense = (id) => unwrap(() => api.delete(`/api/expenses/${id}`));
export const getBudgets = (month, year) =>
  unwrap(() => api.get("/api/budgets", { params: { month, year } }));
export const addBudget = (payload) => unwrap(() => api.post("/api/budgets", payload));
export const updateBudget = (id, payload) =>
  unwrap(() => api.put(`/api/budgets/${id}`, payload));
export const deleteBudget = (id) => unwrap(() => api.delete(`/api/budgets/${id}`));
export const getAnalytics = (month, year) =>
  unwrap(() => api.get("/api/dashboard", { params: { month, year } })).then(normalizeDashboard);
export const getPrediction = (description) =>
  unwrap(() => api.post("/predict", { description }));
export const getMonthlyPrediction = (month, year) =>
  unwrap(() => api.get("/api/prediction/monthly", { params: { month, year } }));
export const getSavingsInsights = () => unwrap(() => api.get("/api/savings-insights"));
export const getOverspendingAlerts = (month, year) =>
  unwrap(() => api.get("/api/overspending", { params: { month, year } }));

export default api;
