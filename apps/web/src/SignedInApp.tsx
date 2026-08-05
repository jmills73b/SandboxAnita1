import { useState } from "react";
import { logout } from "./api";
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
  const goHome = () => setScreen({ kind: "hub" });

  return (
    <main className="page">
      <header className="page-header">
        <Brand onClick={screen.kind === "hub" ? undefined : goHome} />
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={() => setShowInviteCode((prev) => !prev)}>
            Invite code
          </button>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>
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
