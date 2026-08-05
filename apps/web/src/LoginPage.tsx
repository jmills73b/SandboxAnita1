import { useState, type FormEvent } from "react";
import { login, register } from "./api";
import { Brand } from "./Brand";

const MIN_PASSWORD_LENGTH = 8;

type Mode = "sign-in" | "join";

export function LoginPage({ onLoggedIn }: { onLoggedIn: (email: string) => void }) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "join") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }

    setSubmitting(true);
    try {
      const user = mode === "sign-in" ? await login(email, password) : await register(email, password, inviteCode);
      onLoggedIn(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page page-narrow">
      <Brand />
      <div className="mode-toggle auth-mode-toggle" role="group" aria-label="Sign in or join">
        <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => switchMode("sign-in")}>
          Sign in
        </button>
        <button type="button" className={mode === "join" ? "active" : ""} onClick={() => switchMode("join")}>
          Join now
        </button>
      </div>
      <h1>{mode === "sign-in" ? "Sign in" : "Create your account"}</h1>
      {mode === "join" && (
        <p className="hint">You'll need an invite code from someone who already has access.</p>
      )}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={mode === "join" ? MIN_PASSWORD_LENGTH : undefined}
          />
        </label>
        {mode === "join" && (
          <>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
            <label>
              Invite code
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                required
              />
            </label>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting
            ? mode === "sign-in"
              ? "Signing in…"
              : "Creating account…"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </main>
  );
}
