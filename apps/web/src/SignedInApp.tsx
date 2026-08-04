import { useState } from "react";
import { logout } from "./api";
import { Dashboard } from "./Dashboard";
import { InvoicesPage } from "./InvoicesPage";
import { Brand } from "./Brand";

type Screen = { kind: "hub" } | { kind: "invoices" };

export function SignedInApp({
  email,
  onLoggedOut,
}: {
  email: string;
  onLoggedOut: () => void;
}) {
  const [screen, setScreen] = useState<Screen>({ kind: "hub" });

  return (
    <main className="page">
      <header className="page-header">
        <Brand onClick={screen.kind === "hub" ? undefined : () => setScreen({ kind: "hub" })} />
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>
      {screen.kind === "hub" ? (
        <Dashboard onSelectInvoices={() => setScreen({ kind: "invoices" })} />
      ) : (
        <InvoicesPage onBack={() => setScreen({ kind: "hub" })} />
      )}
    </main>
  );
}
