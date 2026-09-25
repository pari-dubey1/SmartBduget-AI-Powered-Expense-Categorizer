/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";

const CurrencyContext = createContext(null);
const symbols = { INR: "₹", USD: "$", EUR: "€" };
const locales = { INR: "en-IN", USD: "en-US", EUR: "de-DE" };

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem("smartbudget-currency") || "INR");
  const value = useMemo(() => ({
    currency,
    symbol: symbols[currency],
    setCurrency: (next) => { localStorage.setItem("smartbudget-currency", next); setCurrency(next); },
    formatMoney: (amount, options = {}) => `${symbols[currency]}${Number(amount || 0).toLocaleString(locales[currency], { maximumFractionDigits: 0, ...options })}`,
  }), [currency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
