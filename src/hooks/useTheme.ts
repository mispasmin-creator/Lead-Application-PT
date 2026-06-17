export type Theme = "light";

export function useTheme() {
  // Dark mode removed — always light
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark");
  }
  return { theme: "light" as Theme };
}
