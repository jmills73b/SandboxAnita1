import { useEffect, useState } from "react";
import { getTasks, logout } from "./api";
import { AdminPage } from "./AdminPage";
import { ClientsPage } from "./ClientsPage";
import { Dashboard, type DashboardTile } from "./Dashboard";
import { ExpensesPage } from "./ExpensesPage";
import { InvoiceGeneratorPage } from "./InvoiceGeneratorPage";
import { InvoicesPage } from "./InvoicesPage";
import { PerformancePage } from "./PerformancePage";
import { TaskSummaryPanel } from "./TaskSummaryPanel";
import { TasksPage } from "./TasksPage";
import { TaxPage } from "./TaxPage";
import { ThemeQuickSwitch } from "./ThemeQuickSwitch";
import { TimeKeepingPage } from "./TimeKeepingPage";
import { Brand } from "./Brand";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Screen = { kind: "hub" } | { kind: DashboardTile };

export function SignedInApp({
  email,
  onLoggedOut,
}: {
  email: string;
  onLoggedOut: () => void;
}) {
  const [screen, setScreen] = useState<Screen>({ kind: "hub" });
  const [showTasks, setShowTasks] = useState(false);
  const [dueTaskCount, setDueTaskCount] = useState(0);
  const goHome = () => setScreen({ kind: "hub" });

  async function refreshDueTaskCount() {
    try {
      const tasks = await getTasks();
      const today = todayISO();
      setDueTaskCount(tasks.filter((t) => !t.paused && t.nextDueDate <= today).length);
    } catch {
      // The header badge is a convenience, not critical — leave it as-is
      // rather than surfacing an error banner over the whole app for it.
    }
  }

  useEffect(() => {
    refreshDueTaskCount();
  }, [screen.kind]);

  return (
    <main className="page">
      <header className="page-header">
        <Brand onClick={screen.kind === "hub" ? undefined : goHome} />
        <div className="page-header-right">
          <span className="who">{email}</span>
          <div className="page-header-buttons">
            <ThemeQuickSwitch />
            <button
              type="button"
              className="secondary task-badge-button"
              onClick={() => setShowTasks((prev) => !prev)}
            >
              Tasks
              {dueTaskCount > 0 && <span className="task-badge">{dueTaskCount}</span>}
            </button>
            <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      {showTasks && (
        <TaskSummaryPanel
          onClose={() => {
            setShowTasks(false);
            refreshDueTaskCount();
          }}
        />
      )}
      {screen.kind === "hub" && <Dashboard onSelect={(tile) => setScreen({ kind: tile })} />}
      {screen.kind === "invoices" && <InvoicesPage onBack={goHome} />}
      {screen.kind === "performance" && <PerformancePage onBack={goHome} />}
      {screen.kind === "invoice-generator" && <InvoiceGeneratorPage onBack={goHome} />}
      {screen.kind === "expenses" && <ExpensesPage onBack={goHome} />}
      {screen.kind === "tax" && <TaxPage onBack={goHome} />}
      {screen.kind === "time" && <TimeKeepingPage onBack={goHome} />}
      {screen.kind === "clients" && <ClientsPage onBack={goHome} />}
      {screen.kind === "tasks" && <TasksPage onBack={goHome} />}
      {screen.kind === "admin" && <AdminPage onBack={goHome} />}
    </main>
  );
}
