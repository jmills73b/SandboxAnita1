export type Theme = "light" | "dark" | "feelgood";

const STORAGE_KEY = "acm-theme";
const THEME_EVENT = "acm-theme-change";

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
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

// The header's icon-only switcher and the full picker in Admin & Settings
// are two separately-mounted components, each tracking the active theme in
// its own local state. Without this, changing the theme in one leaves the
// other showing a stale "active" highlight until it happens to remount.
export function onThemeChange(listener: (theme: Theme) => void): () => void {
  function handleThemeEvent(event: Event) {
    listener((event as CustomEvent<Theme>).detail);
  }
  window.addEventListener(THEME_EVENT, handleThemeEvent);
  return () => window.removeEventListener(THEME_EVENT, handleThemeEvent);
}
