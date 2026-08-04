// Every call goes to the Worker API on its own domain, so credentials:
// "include" is required for the session cookie to be sent — plain
// same-origin defaults won't do that.
const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface Client {
  id: number;
  name: string;
  first_invoice_date: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Something went wrong (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function login(email: string, password: string): Promise<{ email: string }> {
  return request("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/api/logout", { method: "POST" });
}

export function me(): Promise<{ email: string }> {
  return request("/api/me");
}

export function getClients(): Promise<Client[]> {
  return request("/api/clients");
}

export function addClient(name: string): Promise<Client> {
  return request("/api/clients", { method: "POST", body: JSON.stringify({ name }) });
}
