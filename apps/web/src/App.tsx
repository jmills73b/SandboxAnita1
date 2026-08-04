import { useEffect, useState } from "react";
import { SetupPage } from "./SetupPage";
import { LoginPage } from "./LoginPage";
import { ClientsPage } from "./ClientsPage";
import { getSetupStatus, me } from "./api";

type AppStatus =
  | { kind: "checking" }
  | { kind: "needs-setup" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; email: string };

export default function App() {
  const [status, setStatus] = useState<AppStatus>({ kind: "checking" });

  useEffect(() => {
    getSetupStatus()
      .then(async ({ completed }) => {
        if (!completed) {
          setStatus({ kind: "needs-setup" });
          return;
        }
        try {
          const user = await me();
          setStatus({ kind: "signed-in", email: user.email });
        } catch {
          setStatus({ kind: "signed-out" });
        }
      })
      .catch(() => setStatus({ kind: "signed-out" }));
  }, []);

  if (status.kind === "checking") {
    return <p className="loading">Loading…</p>;
  }

  if (status.kind === "needs-setup") {
    return <SetupPage onComplete={(email) => setStatus({ kind: "signed-in", email })} />;
  }

  if (status.kind === "signed-out") {
    return <LoginPage onLoggedIn={(email) => setStatus({ kind: "signed-in", email })} />;
  }

  return (
    <ClientsPage
      email={status.email}
      onLoggedOut={() => setStatus({ kind: "signed-out" })}
    />
  );
}
