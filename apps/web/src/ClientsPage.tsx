import { useEffect, useState, type FormEvent } from "react";
import { addClient, getClients, logout, type Client } from "./api";

export function ClientsPage({
  email,
  onLoggedOut,
}: {
  email: string;
  onLoggedOut: () => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setClients(await getClients());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addClient(name);
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that client");
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Clients</h1>
        <div className="page-header-right">
          <span className="who">{email}</span>
          <button type="button" className="secondary" onClick={() => logout().then(onLoggedOut)}>
            Sign out
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="form form-inline">
        <label className="sr-only" htmlFor="client-name">
          Client name
        </label>
        <input
          id="client-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New client name"
          required
        />
        <button type="submit">Add client</button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : clients.length === 0 ? (
        <p className="empty">No clients yet — add the first one above.</p>
      ) : (
        <ul className="client-list">
          {clients.map((client) => (
            <li key={client.id}>{client.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
