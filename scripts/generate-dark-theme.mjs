// Generates src/styles/dark-theme.generated.css: a dark counterpart for every
// Tailwind colour class used in src/ (bg-, text-, border-, divide-, ring-,
// from-/via-/to-), including hover:/focus:/responsive variants.
//
// Run after adding new colour classes:   node scripts/generate-dark-theme.mjs
//
// Dark mode is switched by <html data-theme="dark">. The rules only change colours
// of classes that are LIGHT (white, pastels, light borders, dark text); saturated
// colours (brand purple, solid buttons) are left as they are.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const palette = JSON.parse(fs.readFileSync(path.join(here, 'dark-theme-palette.json'), 'utf8'));

// ---------- colour helpers ----------
const hexToRgb = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
};
const hslToHex = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Neutral colours get a faint violet tint so dark surfaces match the brand
const NEUTRAL_HUE = 285;
const isNeutral = (s) => s < 0.12;

const darkBg = (hex, neutral) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (l < 0.8) return null; // saturated / mid colours stay
  const lightness = 0.13 + (1 - l) * 0.9;
  return (neutral || isNeutral(s)) ? hslToHex(NEUTRAL_HUE, 0.14, lightness) : hslToHex(h, clamp(s * 0.55, 0.12, 0.45), lightness);
};
const darkText = (hex, neutral) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (l > 0.6) return null; // already light: fine on dark surfaces
  const lightness = clamp(0.97 - 0.62 * l, 0.6, 0.93);
  return (neutral || isNeutral(s)) ? hslToHex(NEUTRAL_HUE, 0.1, lightness) : hslToHex(h, clamp(s * 0.65, 0.2, 0.7), lightness);
};
const darkBorder = (hex, neutral) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (l < 0.7) return null;
  const lightness = clamp(0.12 + (1 - l) * 0.9, 0.16, 0.32);
  return (neutral || isNeutral(s)) ? hslToHex(NEUTRAL_HUE, 0.12, lightness) : hslToHex(h, clamp(s * 0.45, 0.1, 0.4), lightness);
};
// Page-background gradient stops (from-violet-50 via-purple-50 to-indigo-100 ...)
const darkStop = (hex, neutral) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (l < 0.85) return null;
  const lightness = 0.075 + (1 - l) * 0.35;
  return (neutral || isNeutral(s)) ? hslToHex(NEUTRAL_HUE, 0.2, lightness) : hslToHex(h, clamp(s * 0.5, 0.15, 0.4), lightness);
};

// ---------- class -> colour ----------
const COLOR_RE = /^(white|black|transparent|current|(?:[a-z]+)-\d{2,3}|\[#[0-9a-fA-F]{3,8}\])(?:\/(\d{1,3}))?$/;
const colorOf = (token) => {
  const m = COLOR_RE.exec(token);
  if (!m) return null;
  const [, name, alpha] = m;
  let hex = null;
  if (name === 'white') hex = '#ffffff';
  else if (name === 'black') hex = '#000000';
  else if (name.startsWith('[#')) {
    hex = name.slice(1, -1);
    if (hex.length === 9) hex = hex.slice(0, 7); // ignore embedded alpha
  } else {
    const [fam, shade] = name.split(/-(?=\d+$)/);
    hex = palette[fam]?.[shade] || null;
  }
  if (!hex) return null;
  // grey families are treated as neutral so all dark greys share the violet tint
  const neutral = /^(white|black|gray|slate|zinc|neutral|stone)/.test(name);
  return { hex, alpha: alpha === undefined ? 1 : Number(alpha) / 100, name, neutral };
};

const VARIANTS = {
  hover: ':hover', focus: ':focus', 'focus-visible': ':focus-visible', active: ':active',
  disabled: ':disabled', 'focus-within': ':focus-within', placeholder: '::placeholder', file: '::file-selector-button',
};
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

const escapeClass = (cls) => cls.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);

// ---------- collect classes ----------
const files = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|html)$/.test(f)) files.push(p);
  }
};
walk(path.join(root, 'src'));
files.push(path.join(root, 'index.html'));

const candidates = new Set();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/[^\s"'`{}<>=;,()]+(?:\[[^\]\s]*\][^\s"'`{}<>=;,()]*)*/g)) candidates.add(m[0]);
}

// ---------- build rules ----------
const rules = { base: new Set() };
for (const bp of Object.keys(BREAKPOINTS)) rules[bp] = new Set();
const skipped = new Set();

const KINDS = ['bg', 'text', 'border', 'divide', 'ring', 'from', 'via', 'to'];

for (const cls of [...candidates].sort()) {
  const parts = cls.split(':');
  const utility = parts.pop();
  const kindMatch = /^(bg|text|border|divide|ring|from|via|to)-(.+)$/.exec(utility);
  if (!kindMatch) continue;
  const [, kind, rest] = kindMatch;
  const c = colorOf(rest);
  if (!c) continue;

  // variants
  let bp = 'base';
  let pseudo = '';
  let groupHover = false;
  let ok = true;
  for (const v of parts) {
    if (BREAKPOINTS[v]) bp = v;
    else if (v === 'group-hover') groupHover = true;
    else if (VARIANTS[v]) pseudo += VARIANTS[v];
    else if (v === 'dark') ok = false;
    else ok = false;
  }
  if (!ok) { skipped.add(cls); continue; }

  let selector = `html[data-theme="dark"] .${escapeClass(cls)}${pseudo}`;
  if (groupHover) selector = `html[data-theme="dark"] .group:hover .${escapeClass(cls)}${pseudo}`;

  let decl = null;
  const withAlpha = (hex, a) => {
    const [r, g, b] = hexToRgb(hex);
    return a >= 1 ? hex : `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  if (kind === 'bg') {
    if (c.name === 'white' && c.alpha < 0.45) continue; // white glass on coloured areas stays
    const d = c.name === 'white' && c.alpha < 1 ? darkBg('#ffffff', true) : darkBg(c.hex, c.neutral);
    if (!d) continue;
    decl = `background-color: ${withAlpha(d, c.alpha)};`;
  } else if (kind === 'text') {
    if (c.name === 'white') continue;
    const d = darkText(c.hex, c.neutral);
    if (!d) continue;
    decl = `color: ${withAlpha(d, c.alpha)};`;
  } else if (kind === 'border' || kind === 'divide' || kind === 'ring') {
    if (c.name === 'white' && c.alpha === 1) { decl = kind === 'border' ? 'border-color: #3a3344;' : null; }
    else {
      const d = darkBorder(c.hex, c.neutral);
      if (!d) continue;
      if (kind === 'border') decl = `border-color: ${withAlpha(d, c.alpha)};`;
      else if (kind === 'divide') {
        selector += ' > :not([hidden]) ~ :not([hidden])';
        decl = `border-color: ${withAlpha(d, c.alpha)};`;
      } else decl = `--tw-ring-color: ${withAlpha(d, c.alpha)};`;
    }
    if (!decl) continue;
  } else {
    // gradient stops
    const d = darkStop(c.hex, c.neutral);
    if (!d) continue;
    if (kind === 'from') decl = `--tw-gradient-from: ${d} var(--tw-gradient-from-position); --tw-gradient-to: ${d}00 var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`;
    else if (kind === 'via') decl = `--tw-gradient-to: ${d}00 var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), ${d} var(--tw-gradient-via-position), var(--tw-gradient-to);`;
    else decl = `--tw-gradient-to: ${d} var(--tw-gradient-to-position);`;
  }
  rules[bp].add(`${selector} { ${decl} }`);
}

let out = `/* GENERATED by scripts/generate-dark-theme.mjs - do not edit by hand.\n   Dark counterparts of the portal's light colour classes (see data-theme in utils/theme.js). */\n`;
out += [...rules.base].join('\n') + '\n';
for (const [bp, px] of Object.entries(BREAKPOINTS)) {
  if (rules[bp].size) out += `@media (min-width: ${px}px) {\n${[...rules[bp]].map((r) => '  ' + r).join('\n')}\n}\n`;
}
fs.writeFileSync(path.join(root, 'src/styles/dark-theme.generated.css'), out);
const total = Object.values(rules).reduce((n, s) => n + s.size, 0);
console.log(`Wrote ${total} dark rules.` + (skipped.size ? ` Skipped (unsupported variants): ${[...skipped].join(', ')}` : ''));
