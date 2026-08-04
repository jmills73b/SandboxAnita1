import { useEffect, useState } from "react";
import { LoginPage } from "./LoginPage";
import { ClientsPage } from "./ClientsPage";
import { me } from "./api";

export default function App() {
  // undefined = still checking; null = signed out; string = signed-in email
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    me()
      .then((user) => setEmail(user.email))
      .catch(() => setEmail(null));
  }, []);

  if (email === undefined) {
    return <p className="loading">Loading…</p>;
  }

  if (email === null) {
    return <LoginPage onLoggedIn={setEmail} />;
  }

  return <ClientsPage email={email} onLoggedOut={() => setEmail(null)} />;
}
