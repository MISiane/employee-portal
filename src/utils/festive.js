import { useSyncExternalStore } from 'react';

// Christmas mode: icy background, falling snow, lights, drifts and a Santa hat.
//
// - On automatically from 1 November to 6 January.
// - Anyone can switch it off with the snowflake button (remembered in this browser).
// - ?snow=on in any page address previews it out of season, ?snow=off hides it.
// - Devices set to "reduce motion" start with it off (no moving snow or twinkling);
//   the button lets them opt in, with slower flakes and no twinkling.

const STORAGE_KEY = 'portal_snow';

export const inSeason = (now = new Date()) => {
  const month = now.getMonth(); // 0 = January
  return month === 10 || month === 11 || (month === 0 && now.getDate() <= 6);
};

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
};
const write = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    /* storage unavailable: the choice just lasts until reload */
  }
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const initial = () => {
  const param = new URLSearchParams(window.location.search).get('snow');
  if (param === 'on') {
    write('on');
    return true;
  }
  if (param === 'off') {
    write('off');
    return false;
  }
  const saved = read();
  if (saved === 'on') return true;
  if (saved === 'off') return false;
  return inSeason() && !prefersReducedMotion();
};

let enabled = null;
const listeners = new Set();

const apply = () => {
  document.documentElement.dataset.festive = enabled ? 'on' : 'off';
  document.documentElement.dataset.festiveMotion = prefersReducedMotion() ? 'reduced' : 'full';
};

const ensure = () => {
  if (enabled === null) {
    enabled = initial();
    apply();
  }
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setFestive = (value) => {
  ensure();
  enabled = value;
  write(value ? 'on' : 'off');
  apply();
  listeners.forEach((l) => l());
};

export const getFestive = () => {
  ensure();
  return enabled;
};

export const useFestive = () => useSyncExternalStore(subscribe, getFestive, () => false);

// Show the button (and anything festive) only in season, or once someone switched it on
export const festiveAvailable = () => inSeason() || read() === 'on' || getFestive();
