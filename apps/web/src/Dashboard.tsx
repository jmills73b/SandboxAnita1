import { useEffect, useState } from "react";
import { currentTaxYearStartYear } from "@sandboxanita1/core";
import { getInvoices, getTaxYearSettings } from "./api";
import { currentYearToDateSummary } from "./PerformancePage";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const TILES = [
  {
    key: "clients",
    name: "Clients",
    desc: "Maintain the client list, with contact details and categories.",
    active: true,
  },
  {
    key: "time",
    name: "Time Keeping",
    desc: "Log chargeable time against a client, in configurable billing units.",
    active: true,
  },
  {
    key: "invoices",
    name: "Invoice Management",
    desc: "Log invoices, track status, and see performance by client.",
    active: true,
  },
  {
    key: "performance",
    name: "Performance & Targets",
    desc: "See where you stand against this month's target.",
    active: true,
  },
  {
    key: "invoice-generator",
    name: "Invoice Generator",
    desc: "Bill Newmans for invoices awaiting payment, and see past invoices sent.",
    active: true,
  },
  {
    key: "expenses",
    name: "Expenses",
    desc: "Log and categorise business expenses.",
    active: true,
  },
  {
    key: "tax",
    name: "Tax & NI Estimate",
    desc: "Estimate this year's income tax and National Insurance.",
    active: true,
  },
  {
    key: "tasks",
    name: "Tasks & Reminders",
    desc: "Track recurring and one-off things to do, with due dates and history.",
    active: true,
  },
  {
    key: "admin",
    name: "Admin & Settings",
    desc: "Manage categories, billing settings, and account tools for every function.",
    active: true,
  },
] as const;

export type DashboardTile = (typeof TILES)[number]["key"];

export function Dashboard({
  onSelect,
  disabledFeatures = [],
}: {
  onSelect: (tile: DashboardTile) => void;
  disabledFeatures?: string[];
}) {
  const visibleTiles = TILES.filter((tile) => !disabledFeatures.includes(tile.key));
  const [ytdSummary, setYtdSummary] = useState<{ actual: number; target: number } | null>(null);

  // A quick glance at progress shouldn't require tapping into Performance
  // & Targets first -- so the same "Year to date" figure that page shows
  // is surfaced right on its tile. Best-effort: no monthly target set yet,
  // or the fetch fails, and the tile just falls back to its plain
  // description rather than showing a broken or stale number.
  useEffect(() => {
    if (disabledFeatures.includes("performance")) return;
    Promise.all([getInvoices(), getTaxYearSettings(currentTaxYearStartYear())])
      .then(([invoices, settings]) => {
        if (!settings.monthlyTarget) return;
        setYtdSummary(currentYearToDateSummary(invoices, currentTaxYearStartYear(), settings.monthlyTarget));
      })
      .catch(() => {
        // Leave the tile's plain description in place.
      });
  }, [disabledFeatures]);

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <div className="hero-grid">
        {visibleTiles.map((tile) =>
          tile.active ? (
            <button
              key={tile.key}
              type="button"
              className="hero-tile"
              onClick={() => onSelect(tile.key)}
            >
              <div className="tile-top">
                <span className="tile-name">{tile.name}</span>
              </div>
              <div>
                <p className="tile-desc">{tile.desc}</p>
                {tile.key === "performance" && ytdSummary && (
                  <p className="tile-stat">
                    {money.format(ytdSummary.actual)} YTD · {Math.round((ytdSummary.actual / ytdSummary.target) * 100)}%
                    of target
                  </p>
                )}
              </div>
            </button>
          ) : (
            <div key={tile.key} className="hero-tile upcoming">
              <div className="tile-top">
                <span className="tile-name">{tile.name}</span>
                <span className="tile-status">Coming soon</span>
              </div>
              <p className="tile-desc">{tile.desc}</p>
            </div>
          ),
        )}
      </div>
    </>
  );
}
