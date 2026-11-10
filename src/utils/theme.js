import { useSyncExternalStore } from 'react';

// Light / dark theme. Dark mode is <html data-theme="dark">; the colours come from
// src/styles/dark-theme*.css. The choice is remembered in this browser. New visitors
// start in light mode (index.html applies a saved choice before the page paints, so
// there is no flash).

const STORAGE_KEY = 'portal_theme';

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
};

let theme = null;
const listeners = new Set();

const apply = () => {
  document.documentElement.dataset.theme = theme;
};

const ensure = () => {
  if (theme === null) {
    theme = read();
    apply();
  }
};

export const getTheme = () => {
  ensure();
  return theme;
};

export const setTheme = (next) => {
  ensure();
  theme = next === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* storage unavailable: the choice lasts until reload */
  }
  apply();
  listeners.forEach((l) => l());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useTheme = () => useSyncExternalStore(subscribe, getTheme, () => 'light');
