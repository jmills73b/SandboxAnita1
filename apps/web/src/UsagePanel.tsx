import { useEffect, useState } from "react";
import { getUsage, type UsageStats } from "./api";

const count = new Intl.NumberFormat("en-GB");

function formatBytes(bytes: number): string {
  const gb = bytes / 1_000_000_000;
  if (gb >= 0.1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1_000_000;
  return `${mb.toFixed(1)} MB`;
}

// Amber past 70% of a free-tier cap, red past 90% — the same "give a
// heads-up before it's a problem" framing as the tax/performance pages'
// status colours, just applied to Cloudflare's daily limits instead.
function fillClass(pct: number): string {
  if (pct >= 90) return "critical";
  if (pct >= 70) return "warn";
  return "";
}

function UsageBar({ label, used, cap, format }: { label: string; used: number; cap: number; format: (n: number) => string }) {
  const pct = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  return (
    <div className="stat-group">
      <div className="stat-group-label">{label}</div>
      <div className="stat-group-figures">
        <span className="stat-actual">{format(used)}</span>
        <span className="stat-of"> of {format(cap)}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-bar-fill ${fillClass(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="stat-group-pct">{Math.round(pct)}% of the daily free-tier limit</div>
    </div>
  );
}

export function UsagePanel({ onClose }: { onClose?: () => void }) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUsage()
      .then(setUsage)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load usage"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Cloudflare usage today</p>
      <p className="hint">
        How close today's activity is to Cloudflare's free-tier daily limits. Resets at midnight UTC.
      </p>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : usage ? (
        <div className="stat-groups">
          <UsageBar label="Worker requests" used={usage.workersRequests.used} cap={usage.workersRequests.cap} format={(n) => count.format(n)} />
          <UsageBar label="D1 rows read" used={usage.d1RowsRead.used} cap={usage.d1RowsRead.cap} format={(n) => count.format(n)} />
          <UsageBar label="D1 rows written" used={usage.d1RowsWritten.used} cap={usage.d1RowsWritten.cap} format={(n) => count.format(n)} />
          <UsageBar label="D1 storage" used={usage.d1Storage.used} cap={usage.d1Storage.cap} format={formatBytes} />
        </div>
      ) : null}
      {onClose && (
        <div className="row-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
