import { useEffect, useState } from "react";
import { getStoredTheme, onThemeChange, setTheme, type Theme } from "./theme";
import { MoonIcon, SmileIcon, SunIcon } from "./ThemeQuickSwitch";

const OPTIONS: Array<{ value: Theme; icon: () => JSX.Element; label: string; desc: string }> = [
  { value: "light", icon: SunIcon, label: "Light", desc: "Warm paper, near-black ink. The default." },
  { value: "dark", icon: MoonIcon, label: "Dark", desc: "Same palette, inverted for low light." },
  {
    value: "feelgood",
    icon: SmileIcon,
    label: "Feel Good",
    desc: "Soft lilac, deep aubergine ink, a violet primary button.",
  },
];

export function AppearanceManager() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme() ?? "light");

  useEffect(() => onThemeChange(setThemeState), []);

  function choose(value: Theme) {
    setTheme(value);
    setThemeState(value);
  }

  return (
    <div>
      <p className="hint">Choose how Caseflow looks on this device.</p>
      <div className="mode-toggle" role="group" aria-label="Appearance">
        {OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={theme === option.value ? "active" : ""}
              onClick={() => choose(option.value)}
            >
              <OptionIcon /> {option.label}
            </button>
          );
        })}
      </div>
      <p className="mode-caption">{OPTIONS.find((o) => o.value === theme)?.desc}</p>
    </div>
  );
}
