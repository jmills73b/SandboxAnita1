import { useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "./theme";

const OPTIONS: Array<{ value: Theme; icon: string; label: string }> = [
  { value: "light", icon: "☀️", label: "Light" },
  { value: "dark", icon: "🌙", label: "Dark" },
  { value: "feelgood", icon: "😊", label: "Feel Good" },
];

export function ThemeQuickSwitch() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme() ?? "light");

  function choose(value: Theme) {
    setTheme(value);
    setThemeState(value);
  }

  return (
    <div className="theme-quick-switch" role="group" aria-label="Appearance">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "active" : ""}
          aria-label={option.label}
          aria-pressed={theme === option.value}
          title={option.label}
          onClick={() => choose(option.value)}
        >
          <span aria-hidden="true">{option.icon}</span>
        </button>
      ))}
    </div>
  );
}
