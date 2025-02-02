import { effect, signal } from "@preact/signals-react";
import { z } from "zod";

const ThemeSchema = z.enum(["light", "dark", "system"]);
type Theme = z.infer<typeof ThemeSchema>;

const storageKey = "theme";
const theme = signal<Theme>(
  ThemeSchema.catch("system").parse(localStorage.getItem(storageKey)),
);

export function initTheme() {
  effect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme.value === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme.value);
  });
}

export const useTheme = () => {
  return {
    theme,
    setTheme(t: Theme) {
      localStorage.setItem(storageKey, t);
      theme.value = t;
    },
  };
};
