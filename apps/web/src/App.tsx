import { useEffect, useState } from "react";
import { SetupPage } from "./SetupPage";
import { LoginPage } from "./LoginPage";
import { SignedInApp } from "./SignedInApp";
import { getSetupStatus, me } from "./api";

type AppStatus =
  | { kind: "checking" }
  | { kind: "needs-setup" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; email: string; fullName: string | null };

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
          setStatus({ kind: "signed-in", email: user.email, fullName: user.fullName });
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
    return (
      <SetupPage
        onComplete={(user) => setStatus({ kind: "signed-in", email: user.email, fullName: user.fullName })}
      />
    );
  }

  if (status.kind === "signed-out") {
    return (
      <LoginPage
        onLoggedIn={(user) => setStatus({ kind: "signed-in", email: user.email, fullName: user.fullName })}
      />
    );
  }

  return (
    <SignedInApp
      email={status.email}
      fullName={status.fullName}
      onFullNameChanged={(fullName) => setStatus({ kind: "signed-in", email: status.email, fullName })}
      onLoggedOut={() => setStatus({ kind: "signed-out" })}
    />
  );
}
