import { useEffect, useState, type FormEvent } from "react";
import {
  addExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  updateExpense,
  type Expense,
  type ExpenseCategory,
} from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
// Plain "YYYY-MM-DD" parsed as UTC midnight — pin the zone or it rolls
// back a day for anyone west of UTC (same fix as the invoice ledger).
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: number };

export function ExpensesPage({ onBack }: { onBack: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function refresh() {
    setLoading(true);
    try {
      const [expenseList, categoryList] = await Promise.all([getExpenses(), getExpenseCategories()]);
      setExpenses(expenseList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function startAdd() {
    setDate(today());
    setDescription("");
    setCost("");
    setCategoryId("");
    setError(null);
    setMode({ kind: "add" });
  }

  function cancelAdd() {
    setError(null);
    setMode({ kind: "list" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedDescription = description.trim();
    const amount = Number(cost);

    if (!trimmedDescription) {
      setError("Enter a description");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a cost greater than £0");
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        date,
        description: trimmedDescription,
        cost: amount,
        categoryId: categoryId ? Number(categoryId) : null,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that expense");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(expense: Expense) {
    setEditDate(expense.date);
    setEditDescription(expense.description);
    setEditCost(String(expense.cost));
    setEditCategoryId(expense.categoryId !== null ? String(expense.categoryId) : "");
    setEditError(null);
    setMode({ kind: "edit", id: expense.id });
  }

  function cancelEdit() {
    setEditError(null);
    setMode({ kind: "list" });
  }

  async function saveEdit(id: number) {
    setEditError(null);

    const trimmedDescription = editDescription.trim();
    const amount = Number(editCost);

    if (!trimmedDescription) {
      setEditError("Enter a description");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Enter a cost greater than £0");
      return;
    }

    setEditSubmitting(true);
    try {
      await updateExpense(id, {
        date: editDate,
        description: trimmedDescription,
        cost: amount,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(`Delete the ${money.format(expense.cost)} expense "${expense.description}"?`);
    if (!confirmed) return;

    try {
      await deleteExpense(expense.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that expense");
    }
  }

  const trimmedSearch = search.trim().toLowerCase();
  const filteredExpenses = expenses.filter(
    (expense) =>
      (categoryFilter === "all" || String(expense.categoryId ?? "") === categoryFilter) &&
      expense.description.toLowerCase().includes(trimmedSearch),
  );

  const totalCost = expenses.reduce((sum, expense) => sum + expense.cost, 0);
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.category ?? "Uncategorised";
    byCategory.set(key, (byCategory.get(key) ?? 0) + expense.cost);
  }
  const categoryBreakdown = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  if (mode.kind === "add") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelAdd}>
          ← Expenses
        </button>
        <h1 className="sr-only">Add expense</h1>
        <form onSubmit={handleSubmit} className="edit-panel">
          <p className="edit-panel-title">Add expense</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Date</span>
              <input type="date" className="input-compact" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="edit-field">
              <span>Description</span>
              <input
                className="input-compact"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="edit-field">
              <span>Category</span>
              <select className="input-compact" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="edit-field">
              <span>Cost</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="input-compact"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                required
              />
            </label>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="row-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add expense"}
            </button>
            <button type="button" onClick={cancelAdd} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </>
    );
  }

  if (mode.kind === "edit") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelEdit}>
          ← Expenses
        </button>
        <h1 className="sr-only">Editing {editDescription || "expense"}</h1>
        <div className="edit-panel">
          <p className="edit-panel-title">Editing "{editDescription || "…"}"</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Date</span>
              <input
                type="date"
                className="input-compact"
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Description</span>
              <input
                className="input-compact"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Category</span>
              <select
                className="input-compact"
                value={editCategoryId}
                onChange={(event) => setEditCategoryId(event.target.value)}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="edit-field">
              <span>Cost</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="input-compact"
                value={editCost}
                onChange={(event) => setEditCost(event.target.value)}
              />
            </label>
          </div>
          {editError && (
            <p className="error" role="alert">
              {editError}
            </p>
          )}
          <div className="row-actions">
            <button type="button" onClick={() => saveEdit(mode.id)} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Expenses</h1>

      <div className="row-actions">
        <button type="button" onClick={startAdd}>
          + Add expense
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!loading && expenses.length > 0 && (
        <div className="client-stats">
          <div className="client-stat">
            <div className="n">{money.format(totalCost)}</div>
            <div className="l">Total expenses</div>
          </div>
          {categoryBreakdown.slice(0, 3).map(([cat, cost]) => (
            <div className="client-stat" key={cat}>
              <div className="n">{money.format(cost)}</div>
              <div className="l">{cat}</div>
            </div>
          ))}
        </div>
      )}

      {expenses.length > 0 && (
        <div className="filters">
          <label className="sr-only" htmlFor="expense-search">
            Search by description
          </label>
          <input
            id="expense-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by description…"
          />
          <label className="sr-only" htmlFor="expense-category-filter">
            Filter by category
          </label>
          <select
            id="expense-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="empty">No expenses yet — add the first one above.</p>
      ) : filteredExpenses.length === 0 ? (
        <p className="empty">No expenses match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{dateFmt.format(new Date(expense.date))}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category ?? "—"}</td>
                  <td>{money.format(expense.cost)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(expense)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(expense)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
