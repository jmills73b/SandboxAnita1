export type Theme = "light" | "dark" | "feelgood";

const STORAGE_KEY = "acm-theme";

const THEMES: Theme[] = ["light", "dark", "feelgood"];

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return (THEMES as string[]).includes(value ?? "") ? (value as Theme) : null;
}

// No stored choice yet means "follow the system setting" — leaving the
// data-theme attribute off lets the existing prefers-color-scheme media
// query decide, same as before this toggle existed.
export function applyTheme(theme: Theme | null): void {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}
