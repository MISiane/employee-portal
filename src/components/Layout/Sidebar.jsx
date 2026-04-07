import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  CurrencyDollarIcon,
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  MegaphoneIcon,
  UserCircleIcon,
  XMarkIcon,
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleLeftIcon, 
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
} from '@heroicons/react/24/solid';


const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Employees', href: '/employees', icon: UsersIcon, iconSolid: UsersIconSolid },
  { name: 'Payslips', href: '/payslips', icon: CurrencyDollarIcon },
  { name: 'Leave Requests', href: '/leave-requests', icon: CalendarIcon },
  { name: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { name: 'Employee Handbook', href: '/policies', icon: BookOpenIcon },
    { name: 'Feedback', href: '/feedback', icon: ChatBubbleLeftIcon }
];

const employeeNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'My Profile', href: '/my-profile', icon: UserCircleIcon },
  { name: 'My Payslips', href: '/my-payslips', icon: CurrencyDollarIcon },
  { name: 'My Leave Requests', href: '/my-leave-requests', icon: CalendarIcon },
  { name: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { name: 'Employee Handbook', href: '/policies', icon: BookOpenIcon },
    { name: 'Support', href: '/support', icon: ChatBubbleLeftIcon },
];
  const navigation = isAdmin ? adminNavigation : employeeNavigation;

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-start gap-3 border-b border-[#993399] bg-[#800080] px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <img
            src="https://lemonethotel.ph/wp-content/uploads/2025/12/le-monet-logo-1024x909.png"
            alt="Lemonet Logo"
            className="h-7 w-7 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          EmployeePortal
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `group flex items-center rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'border border-[#e6cce6] bg-[#f3e5f5] text-[#800080] shadow-sm'
                    : 'text-[#5f5f6b] hover:bg-[#f8ecf8] hover:text-[#800080]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`mr-3 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-[#800080] shadow-sm'
                        : 'bg-transparent text-current group-hover:bg-white/70'
                    }`}
                  >
                    {isActive && item.iconSolid ? (
                      <item.iconSolid className="h-5 w-5" />
                    ) : (
                      <item.icon className="h-5 w-5" />
                    )}
                  </div>

                  <span className="text-sm font-medium">{item.name}</span>

                  {isActive && (
                    <div className="ml-auto h-2.5 w-2.5 rounded-full bg-[#800080]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#e6cce6] p-4">
        <div className="rounded-2xl border border-[#e6cce6] bg-[#f5e6f7] p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#800080] text-sm font-semibold text-white shadow-sm">
              {user?.first_name?.charAt(0) || 'U'}
              {user?.last_name?.charAt(0) || ''}
            </div>

            <div className="ml-3 flex-1">
              <p className="text-xs font-medium text-[#a64ca6]">Logged in as</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.first_name || 'User'} {user?.last_name || ''}
              </p>
              <p className="text-xs capitalize text-gray-500">{user?.role}</p>
            </div>

            <div
              className={`h-2.5 w-2.5 rounded-full ${
                user?.is_active ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-[#800080] p-2 text-white shadow-lg lg:hidden transition-all hover:bg-[#660066] active:scale-95"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Desktop Sidebar - Static, not fixed */}
      <div className="hidden lg:block w-64 bg-[#fbf7fc] border-r border-[#e6cce6] shadow-sm overflow-y-auto shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="fixed left-0 top-0 z-50 h-full w-64 bg-[#fbf7fc] border-r border-[#e6cce6] shadow-xl lg:hidden transform transition-transform duration-300 ease-out">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            
            <div className="h-full overflow-y-auto pt-12">
              <SidebarContent />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;