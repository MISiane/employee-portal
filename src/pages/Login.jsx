import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8f4fa]">
      {/* Left Side - Hidden on mobile, shown on desktop */}
      <div className="relative hidden lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://d384rxa9e2cak.cloudfront.net/public/venuebanner/venues_1456269174_1844_6117.jpg')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#800080]/20 via-[#800080]/10 to-black/50"></div>
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-8 xl:p-12 text-white">
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 xl:h-14 xl:w-14 items-center justify-center rounded-full bg-white shadow-md">
                <img
                  src="https://lemonethotel.ph/wp-content/uploads/2025/12/le-monet-logo-1024x909.png"
                  alt="Le Monet Logo"
                  className="h-8 w-8 xl:h-10 xl:w-10 object-contain"
                />
              </div>
              <span className="text-xl xl:text-2xl font-bold">Employee Portal</span>
            </div>
          </div>

          <div className="space-y-4 xl:space-y-6 bg-black/40 backdrop-blur-sm p-4 xl:p-6 rounded-2xl max-w-xl">
            <h1 className="text-3xl xl:text-5xl font-bold leading-tight">
              Welcome to
              <br />
              Employee Portal
            </h1>
            <p className="text-base xl:text-lg text-white/85">
              Your centralized hub for managing employee information, leave requests,
              payslips, and more.
            </p>

            <div className="grid grid-cols-2 gap-3 xl:gap-4 pt-4 xl:pt-8">
              {['Easy Leave Management', 'Digital Payslips', 'Employee Self-Service', 'Real-time Updates'].map((text, idx) => (
                <div key={idx} className="flex items-center space-x-2 xl:space-x-3 rounded-xl xl:rounded-2xl bg-white/10 p-2 xl:p-3 backdrop-blur-sm">
                  <div className="flex h-6 w-6 xl:h-8 xl:w-8 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-3 w-3 xl:h-4 xl:w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-xs xl:text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs xl:text-sm text-white/75">© 2026 Le Monet Hotel Employee Portal System</div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-[#f8f4fa] p-4 sm:p-6 md:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-6 sm:mb-8 text-center lg:hidden">
            <div className="mb-3 sm:mb-4 inline-flex h-28 w-28 sm:h-40 sm:w-40 items-center justify-center rounded-2xl bg-[#ffffff] shadow-lg">
             <img
                  src="https://lemonethotel.ph/wp-content/uploads/2025/12/le-monet-logo-1024x909.png"
                  alt="Le Monet Logo"
                  className="h-28 w-28 xl:h-28 xl:w-28 object-contain"
                />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Portal</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Sign in to your account</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl sm:rounded-[28px] border border-[#e6cce6] bg-white p-5 sm:p-6 md:p-8 shadow-[0_20px_50px_-20px_rgba(128,0,128,0.18)]">
            <h2 className="mb-1 sm:mb-2 text-2xl sm:text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
              Please enter your credentials to sign in
            </p>

            {error && (
              <div className="animate-shake mb-4 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-red-600">
                <div className="flex items-center text-sm">
                  <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#b08ab0]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-[#e6cce6] bg-[#faf5fb] py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 transition-all focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#b08ab0]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-[#e6cce6] bg-[#faf5fb] py-2.5 sm:py-3 pl-9 sm:pl-10 pr-9 sm:pr-10 text-sm sm:text-base text-gray-700 placeholder-gray-400 transition-all focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#b08ab0] transition-colors hover:text-[#800080]" />
                    ) : (
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#b08ab0] transition-colors hover:text-[#800080]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-[#d9bddc] text-[#800080] focus:ring-[#800080] cursor-pointer"
                  />
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs sm:text-sm text-[#800080] transition-colors hover:text-[#660066]"
                  onClick={() => alert('Please contact MIS to reset your password.')}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#800080] py-2.5 sm:py-3 font-medium text-white shadow-md transition-all duration-200 hover:bg-[#660066] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="-ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials - Optional, can be uncommented if needed */}
            {/* <div className="mt-4 sm:mt-6 border-t border-[#eee5ef] pt-3 sm:pt-4">
              <p className="text-center text-[10px] sm:text-xs text-gray-500 mb-2">Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-[#efe2f0] bg-[#faf5fb] p-2 sm:p-3 text-center">
                  <p className="font-medium text-gray-700 text-[10px] sm:text-xs">Admin</p>
                  <p className="truncate text-[9px] sm:text-xs text-gray-500">admin@employeeportal.com</p>
                  <p className="text-[9px] sm:text-xs text-gray-500">Admin123!</p>
                </div>
                <div className="rounded-xl border border-[#efe2f0] bg-[#faf5fb] p-2 sm:p-3 text-center">
                  <p className="font-medium text-gray-700 text-[10px] sm:text-xs">Employee</p>
                  <p className="truncate text-[9px] sm:text-xs text-gray-500">john.doe@company.com</p>
                  <p className="text-[9px] sm:text-xs text-gray-500">Employee123!</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;