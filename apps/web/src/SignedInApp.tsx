import { useState } from "react";
import { logout } from "./api";
import { InvoicesPage } from "./InvoicesPage";
import { ClientsPage } from "./ClientsPage";

type Tab = "invoices" | "clients";

export function SignedInApp({
  email,
  onLoggedOut,
}: {
  email: string;
  onLoggedOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <main className="page">
      <header className="page-header">
        <nav className="tabs">
          <button
            type="button"
            className={tab === "invoices" ? "tab tab-active" : "tab"}
            onClick={() => setTab("invoices")}
          >
            Invoices
          </button>
          <button
            type="button"
            className={tab === "clients" ? "tab tab-active" : "tab"}
            onClick={() => setTab("clients")}
          >
            Clients
          </button>
        </nav>
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>
      {tab === "invoices" ? <InvoicesPage /> : <ClientsPage />}
    </main>
  );
}
