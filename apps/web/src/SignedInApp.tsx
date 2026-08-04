import { useState } from "react";
import { logout } from "./api";
import { Dashboard, type DashboardTile } from "./Dashboard";
import { InvoicesPage } from "./InvoicesPage";
import { PerformancePage } from "./PerformancePage";
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
  const goHome = () => setScreen({ kind: "hub" });

  return (
    <main className="page">
      <header className="page-header">
        <Brand onClick={screen.kind === "hub" ? undefined : goHome} />
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>
      {screen.kind === "hub" && <Dashboard onSelect={(tile) => setScreen({ kind: tile })} />}
      {screen.kind === "invoices" && <InvoicesPage onBack={goHome} />}
      {screen.kind === "performance" && <PerformancePage onBack={goHome} />}
    </main>
  );
}
