import { useState } from "react";
import { exportAllData, logout } from "./api";
import { ClientsPage } from "./ClientsPage";
import { Dashboard, type DashboardTile } from "./Dashboard";
import { ExpensesPage } from "./ExpensesPage";
import { InviteCodePanel } from "./InviteCodePanel";
import { InvoiceGeneratorPage } from "./InvoiceGeneratorPage";
import { InvoicesPage } from "./InvoicesPage";
import { PerformancePage } from "./PerformancePage";
import { TaxPage } from "./TaxPage";
import { TimeKeepingPage } from "./TimeKeepingPage";
import { Brand } from "./Brand";

type Screen = { kind: "hub" } | { kind: DashboardTile };

export function SignedInApp({
  email,
  onLoggedOut,
}: {
  email: string;
  onLoggedOut: () => void;
}) {
  const [screen, setScreen] = useState<Screen>({ kind: "hub" });
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const goHome = () => setScreen({ kind: "hub" });

  // A plain file download, client-side, rather than anything stored on
  // the server — the same "generate and hand over a file" pattern already
  // used for invoice PDFs. Every business table except users and
  // account_settings (passwords and the invite code have no place in a
  // file that might end up emailed or dropped in a shared drive).
  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `acm-caseflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Couldn't export the data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <Brand onClick={screen.kind === "hub" ? undefined : goHome} />
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export data"}
          </button>
          <button type="button" className="secondary" onClick={() => setShowInviteCode((prev) => !prev)}>
            Invite code
          </button>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>
      {exportError && (
        <p className="error" role="alert">
          {exportError}
        </p>
      )}
      {showInviteCode && <InviteCodePanel onClose={() => setShowInviteCode(false)} />}
      {screen.kind === "hub" && <Dashboard onSelect={(tile) => setScreen({ kind: tile })} />}
      {screen.kind === "invoices" && <InvoicesPage onBack={goHome} />}
      {screen.kind === "performance" && <PerformancePage onBack={goHome} />}
      {screen.kind === "invoice-generator" && <InvoiceGeneratorPage onBack={goHome} />}
      {screen.kind === "expenses" && <ExpensesPage onBack={goHome} />}
      {screen.kind === "tax" && <TaxPage onBack={goHome} />}
      {screen.kind === "time" && <TimeKeepingPage onBack={goHome} />}
      {screen.kind === "clients" && <ClientsPage onBack={goHome} />}
    </main>
  );
}
