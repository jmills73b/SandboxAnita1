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
] as const;

export type DashboardTile = (typeof TILES)[number]["key"];

export function Dashboard({ onSelect }: { onSelect: (tile: DashboardTile) => void }) {
  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <div className="hero-grid">
        {TILES.map((tile) =>
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
              <p className="tile-desc">{tile.desc}</p>
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
