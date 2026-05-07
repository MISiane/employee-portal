import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  XMarkIcon,
  CalendarIcon,
  MegaphoneIcon,
  Bars3Icon,
    CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import api from '../../api/config';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const [showApkInfo, setShowApkInfo] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSearch(false);
      }
      if (
        !event.target.closest('.header-user-menu') &&
        !event.target.closest('.header-user-dropdown')
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

const fetchNotifications = async () => {
  try {
    // Fetch database notifications (leave status, payslips)
    const notificationsRes = await api.get('/notifications', { params: { limit: 20 } });
    const dbNotifications = notificationsRes.data?.notifications || [];
    
    // Format database notifications
    const formattedDbNotifications = dbNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: new Date(n.created_at).toLocaleString(),
      read: n.is_read,
      link: n.type === 'leave_status' ? '/my-leave-requests' : 
            n.type === 'payslip' ? '/my-payslips' : '/announcements',
    }));
    
    // Fetch announcements (for notification bell)
    const announcementsRes = await api.get('/announcements', { params: { limit: 3 } }).catch(() => ({ data: [] }));
    
    // Handle different response structures
    let announcementsList = [];
    if (Array.isArray(announcementsRes.data)) {
      announcementsList = announcementsRes.data;
    } else if (announcementsRes.data?.announcements) {
      announcementsList = announcementsRes.data.announcements;
    } else if (announcementsRes.data?.data) {
      announcementsList = announcementsRes.data.data;
    }
    
    // Get read announcements from localStorage
    const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
    
    // Format announcement notifications (only unread ones)
    const announcementNotifications = announcementsList
      .filter(ann => !readAnnouncements.includes(ann.id))
      .map((ann) => ({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: '📢 New Announcement',
        message: ann.title,
        time: new Date(ann.created_at).toLocaleString(),
        read: false,
        link: '/announcements',
      }));
    
    // Combine both sources
    const allNotifications = [...formattedDbNotifications, ...announcementNotifications]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);
    
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.read).length);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

const markAsRead = async (notificationId) => {
  // Handle announcement notifications (stored in localStorage)
  if (typeof notificationId === 'string' && notificationId.startsWith('ann-')) {
    const annId = parseInt(notificationId.replace('ann-', ''));
    const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
    if (!readAnnouncements.includes(annId)) {
      readAnnouncements.push(annId);
      localStorage.setItem('read_announcements', JSON.stringify(readAnnouncements));
    }
    
    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    return;
  }
  
  // Handle database notifications (leave status, payslips)
  try {
    await api.put(`/notifications/${notificationId}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    // Mark all database notifications as read
    await api.put('/notifications/read-all');
    
    // Mark all announcement notifications as read (store in localStorage)
    const announcementIds = notifications
      .filter(n => typeof n.id === 'string' && n.id.startsWith('ann-') && !n.read)
      .map(n => parseInt(n.id.replace('ann-', '')));
    
    if (announcementIds.length > 0) {
      const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
      const updatedRead = [...new Set([...readAnnouncements, ...announcementIds])];
      localStorage.setItem('read_announcements', JSON.stringify(updatedRead));
    }
    
    // Update local state
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    setShowNotifications(false);
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};

const handleSearch = async (e) => {
  const term = e.target.value;
  setSearchTerm(term);

  if (term.length < 2) {
    setSearchResults([]);
    setShowSearchResults(false);
    return;
  }

  try {
    const employeesRes = await api.get('/employees', { params: { search: term, limit: 5 } });
    const announcementsRes = await api.get('/announcements', { params: { search: term, limit: 3 } });

    const employeesList = employeesRes.data?.employees || [];
    const announcementsList = Array.isArray(announcementsRes.data) ? announcementsRes.data : 
                              (announcementsRes.data?.announcements || []);

    const results = [
      ...employeesList.map((emp) => ({
        id: `emp-${emp.id}`,
        type: 'employee',
        title: `${emp.first_name} ${emp.last_name}`,
        subtitle: emp.email,
        icon: UserCircleIcon,
        link: `/employees?id=${emp.id}`,
        department: emp.department,
        avatar_url: emp.avatar_url,
      })),
      ...announcementsList.map((ann) => ({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: ann.title,
        subtitle: ann.content?.substring(0, 60) + '...',
        icon: MegaphoneIcon,
        link: '/announcements',
      })),
    ];

    setSearchResults(results);
    setShowSearchResults(true);
  } catch (error) {
    console.error('Error searching:', error);
  }
};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate('/my-profile');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave':
        return <CalendarIcon className="h-5 w-5 text-yellow-500" />;
      case 'announcement':
        return <MegaphoneIcon className="h-5 w-5 text-[#800080]" />;
      default:
        return <BellIcon className="h-5 w-5 text-[#800080]" />;
    }
  };

  // Helper to get initials
  const getInitials = () => {
    return `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}`;
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[#e6cce6] bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          {/* Mobile Menu Button - Will be used by Sidebar */}
          <button className="lg:hidden mr-2 p-2 text-[#800080] hover:bg-[#f5e6f7] rounded-xl transition-colors">
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="hidden sm:block relative max-w-md flex-1" ref={searchRef}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a66aa6]" />
              <input
                type="text"
                placeholder="Search employees, announcements..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full rounded-2xl border border-[#e6cce6] bg-[#faf5fb] py-2.5 pl-10 pr-10 text-sm text-gray-700 placeholder:text-[#b08ab0] focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="h-4 w-4 text-[#b08ab0] hover:text-[#800080]" />
                </button>
              )}
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-[#e6cce6] bg-white shadow-[0_16px_40px_-20px_rgba(128,0,128,0.25)]">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => {
                      navigate(result.link);
                      setShowSearchResults(false);
                      setSearchTerm('');
                    }}
                    className="flex cursor-pointer items-center border-b border-[#f1e4f2] p-3 transition-colors hover:bg-[#faf2fb] last:border-0"
                  >
                    {/* Avatar or Icon */}
                    <div className="mr-3">
                      {result.avatar_url ? (
                        <img 
                          src={result.avatar_url} 
                          alt={result.title}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="rounded-xl bg-[#f5e6f7] p-2">
                          <result.icon className="h-5 w-5 text-[#800080]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                      {result.department && (
                        <p className="mt-0.5 text-xs text-[#a07aa0]">{result.department}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="sm:hidden p-2 text-[#800080] hover:bg-[#f5e6f7] rounded-xl transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
<button
  onClick={() => navigate('/mobile-app')}
  className="flex items-center gap-1.5 rounded-2xl px-2 sm:px-3 py-1.5 text-[#800080] transition-colors hover:bg-[#f5e6f7] hover:text-[#660066]"
  title="Download Mobile App"
>
  <CloudArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
  <span className="text-xs sm:text-sm font-medium">Download App</span>
</button>
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-2xl p-2 sm:p-2.5 text-[#800080] transition-colors hover:bg-[#f5e6f7] hover:text-[#660066]"
              >
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#800080] text-[10px] sm:text-xs text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e6cce6] bg-white shadow-[0_16px_40px_-20px_rgba(128,0,128,0.25)]">
                  <div className="border-b border-[#f1e4f2] bg-[#faf5fb] p-4">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <BellIcon className="mx-auto mb-2 h-8 w-8 text-[#d3b5d6]" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            markAsRead(notification.id);
                            navigate(notification.link);
                            setShowNotifications(false);
                          }}
                          className={`cursor-pointer border-b border-[#f5e9f6] p-4 transition-colors ${
                            !notification.read ? 'bg-[#faf5fb]' : 'bg-white'
                          } hover:bg-[#f7edf8]`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                              <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                              <p className="mt-1 text-xs text-[#a07aa0]">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="mt-1 h-2 w-2 rounded-full bg-[#800080]"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                 {/* Mark all as read button - only show if there are unread notifications */}
{unreadCount > 0 && (
  <div className="border-t border-[#f1e4f2] bg-white p-3">
    <button
      onClick={markAllAsRead}
      className="w-full text-center text-sm font-medium text-[#800080] hover:text-[#660066] transition-colors"
    >
      Mark all as read ({unreadCount})
    </button>
  </div>
)}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="header-user-menu flex items-center space-x-2 sm:space-x-3 rounded-2xl border border-[#b86bb8] bg-[#f5e6f7] px-2 sm:px-3 py-1.5 sm:py-2 transition-colors hover:bg-[#edd8ef]"
              >
                {/* Avatar with Profile Picture */}
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full overflow-hidden">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.first_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[10px] sm:text-xs capitalize text-gray-500">{user?.role}</p>
                </div>
                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#a07aa0]" />
              </button>

              {showDropdown && (
                <div className="header-user-dropdown absolute right-0 z-20 mt-2 w-56 sm:w-64 overflow-hidden rounded-2xl border border-[#e6cce6] bg-white shadow-[0_16px_40px_-20px_rgba(128,0,128,0.25)]">
                  <div className="border-b border-[#f1e4f2] bg-[#faf5fb] px-3 sm:px-4 py-3 sm:py-4">
                    {/* User info with avatar */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full overflow-hidden">
                        {user?.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.first_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm sm:text-base font-bold text-white">
                              {getInitials()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[150px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProfileClick}
                    className="flex w-full items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 transition-colors hover:bg-[#faf2fb]"
                  >
                    <UserCircleIcon className="mr-2 h-4 w-4 text-[#800080]" />
                    My Profile
                  </button>

<button
  onClick={() => {
    setShowDropdown(false);
    navigate('/mobile-app');
  }}
  className="flex w-full items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 transition-colors hover:bg-[#faf2fb]"
>
  <CloudArrowDownIcon className="mr-2 h-4 w-4 text-[#800080]" />
  Download Mobile App
</button>

                  <div className="my-1 border-t border-[#f1e4f2]"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-white sm:hidden" ref={mobileSearchRef}>
          <div className="flex items-center p-4 border-b border-gray-200">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, announcements..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="ml-3 p-2 text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4">
            {searchTerm.length >= 2 && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => {
                      navigate(result.link);
                      setShowMobileSearch(false);
                      setSearchTerm('');
                    }}
                    className="flex cursor-pointer items-center rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="mr-3">
                      {result.avatar_url ? (
                        <img 
                          src={result.avatar_url} 
                          alt={result.title}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="rounded-lg bg-[#f5e6f7] p-2">
                          <result.icon className="h-5 w-5 text-[#800080]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                      {result.department && (
                        <p className="mt-0.5 text-xs text-[#a07aa0]">{result.department}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.length >= 2 && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found for "{searchTerm}"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
};

export default Header;