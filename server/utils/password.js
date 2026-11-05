const crypto = require('crypto');

// Characters that are easy to misread when typed from a printout or chat
// message (no 0/O, 1/l/I) are left out.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*?';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

const pick = (set) => set[crypto.randomInt(set.length)];

// Temporary password from a cryptographically secure source, always with at
// least one upper-case letter, lower-case letter, digit and symbol.
const generateTempPassword = (length = 12) => {
  const size = Math.max(length, 8);
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < size) chars.push(pick(ALL));

  // Fisher-Yates shuffle so the guaranteed characters are not always first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

module.exports = { generateTempPassword };
