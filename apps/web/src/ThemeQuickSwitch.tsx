import { useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "./theme";

// Plain line icons rather than native emoji — emoji render in their own
// fixed colours (a yellow sun/moon) regardless of the button's state, so
// they'd stay yellow-on-dark when active instead of inverting like the
// rest of the app's ink/paper system. These use currentColor so the
// button's own color rule controls them.
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

const OPTIONS: Array<{ value: Theme; icon: () => JSX.Element; label: string }> = [
  { value: "light", icon: SunIcon, label: "Light" },
  { value: "dark", icon: MoonIcon, label: "Dark" },
  { value: "feelgood", icon: SmileIcon, label: "Feel Good" },
];

export function ThemeQuickSwitch() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme() ?? "light");

  function choose(value: Theme) {
    setTheme(value);
    setThemeState(value);
  }

  return (
    <div className="theme-quick-switch" role="group" aria-label="Appearance">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={theme === option.value ? "active" : ""}
            aria-label={option.label}
            aria-pressed={theme === option.value}
            title={option.label}
            onClick={() => choose(option.value)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
