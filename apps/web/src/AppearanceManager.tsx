import { useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "./theme";

const OPTIONS: Array<{ value: Theme; label: string; desc: string }> = [
  { value: "light", label: "Light", desc: "Warm paper, near-black ink. The default." },
  { value: "dark", label: "Dark", desc: "Same palette, inverted for low light." },
  { value: "feelgood", label: "Feel Good", desc: "Soft lilac, deep aubergine ink, a violet primary button." },
];

export function AppearanceManager() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme() ?? "light");

  function choose(value: Theme) {
    setTheme(value);
    setThemeState(value);
  }

  return (
    <div>
      <p className="hint">Choose how Caseflow looks on this device.</p>
      <div className="mode-toggle" role="group" aria-label="Appearance">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={theme === option.value ? "active" : ""}
            onClick={() => choose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mode-caption">{OPTIONS.find((o) => o.value === theme)?.desc}</p>
    </div>
  );
}
