import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme, setTheme } from '../../utils/theme';

// Light / dark switch for the header
const ThemeToggle = () => {
  const theme = useTheme();
  const dark = theme === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      title={label}
      aria-label={label}
      className="rounded-2xl p-2 sm:p-2.5 text-[#800080] transition-colors hover:bg-[#f5e6f7] hover:text-[#660066]"
    >
      {dark ? <SunIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
    </button>
  );
};

export default ThemeToggle;
