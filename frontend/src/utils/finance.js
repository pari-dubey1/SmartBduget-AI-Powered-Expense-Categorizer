export const toNumber = (value) => Number(value || 0);

export const monthKey = (date) => {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : `${parsed.getFullYear()}-${parsed.getMonth() + 1}`;
};

export const spendingForBudget = (expenses, budget) => expenses
  .filter((expense) => monthKey(expense.date) === `${budget.year}-${budget.month}` && expense.category === budget.category)
  .reduce((total, expense) => total + toNumber(expense.amount), 0);

export const groupBy = (expenses, getKey) => expenses.reduce((groups, expense) => {
  const key = getKey(expense);
  if (key) groups[key] = (groups[key] || 0) + toNumber(expense.amount);
  return groups;
}, {});

export const titleCase = (value = "") => value.replace(/\b\w/g, (character) => character.toUpperCase());
