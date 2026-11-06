import { useFestive } from '../../utils/festive';

// Little Santa hat, perched on the logo
const SantaHat = () => {
  const enabled = useFestive();
  if (!enabled) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 34"
      className="pointer-events-none absolute -right-2 -top-3 h-6 w-7 rotate-[18deg]"
    >
      <path d="M4 26 C6 10 18 2 30 6 C26 10 28 18 32 26 Z" fill="#dc2626" />
      <path d="M30 6 C34 7 36 11 34 14" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="15" r="4.5" fill="#fff" />
      <rect x="2" y="24" width="32" height="8" rx="4" fill="#fff" />
    </svg>
  );
};

export default SantaHat;
