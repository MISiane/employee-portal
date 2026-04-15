import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getPayslips } from '../api/payslips';
import { getMyLeaveRequests, getLeaveBalances } from '../api/leave';
import { getLatestAnnouncements } from '../api/announcements';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    daysPresent: 0,
    daysTarget: 22,
    pendingLeaves: 0,
    nextPayday: '',
    leaveBalances: {
      vacation_leave: 0,
      sick_leave: 0,
      emergency_leave: 0,
      special_leave: 0
    }
  });
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [urgentAnnouncements, setUrgentAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [payslipsData, leaveRequestsData, leaveBalancesData, announcementsData] = await Promise.all([
        getPayslips({ limit: 3 }),
        getMyLeaveRequests({ limit: 3 }).catch(() => ({ leaveRequests: [] })),
        getLeaveBalances().catch(() => ({
          vacation_leave: 15,
          sick_leave: 10,
          emergency_leave: 5,
          special_leave: 0
        })),
        getLatestAnnouncements(5).catch(() => [])
      ]);

      setRecentPayslips(payslipsData.payslips || []);
      setRecentLeaves(leaveRequestsData.leaveRequests || []);

      const allAnnouncements = announcementsData || [];
      const urgent = allAnnouncements.filter((a) => {
        if (a.expires_at) {
          const expiresIn = new Date(a.expires_at) - new Date();
          const daysUntilExpire = expiresIn / (1000 * 60 * 60 * 24);
          return daysUntilExpire <= 3;
        }
        return false;
      });

      setUrgentAnnouncements(urgent);
      setAnnouncements(allAnnouncements.slice(0, 3));

      const pendingCount = (leaveRequestsData.leaveRequests || []).filter(
        (l) => l.status === 'pending'
      ).length;

      const today = new Date();
      let nextPayday;
      if (today.getDate() < 15) {
        nextPayday = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      setStats({
        daysPresent: 18,
        daysTarget: 22,
        pendingLeaves: pendingCount,
        nextPayday: nextPayday.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        leaveBalances: leaveBalancesData || {
          vacation_leave: 15,
          sick_leave: 10,
          emergency_leave: 5,
          special_leave: 0
        }
      });

      setUpcomingEvents([
        { id: 1, type: 'meeting', title: 'Team Meeting', date: 'Today, 3:00 PM' },
        { id: 2, type: 'birthday', title: "John Doe's Birthday", date: 'Tomorrow' },
        { id: 3, type: 'holiday', title: 'Good Friday', date: 'March 29, 2024' }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAnnouncementDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-4 sm:p-5 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(128,0,128,0.22)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs sm:text-sm text-gray-500">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
          {subtext && <p className="mt-1 text-[10px] sm:text-xs text-gray-400">{subtext}</p>}
        </div>
        <div className={`${color} rounded-lg sm:rounded-xl p-2 sm:p-3`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl sm:rounded-[28px] bg-[#f5e6f7]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-b-2 border-[#800080]"></div>
          <p className="text-sm sm:text-base text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="rounded-xl sm:rounded-[30px] bg-[#800080] p-4 sm:p-6 text-white shadow-[0_20px_60px_-20px_rgba(128,0,128,0.45)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="mb-1 sm:mb-2 text-xl sm:text-2xl font-bold">
              {getGreeting()}, {user?.first_name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/85">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-white/80">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-block sm:block rounded-xl bg-white/10 p-2 sm:p-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm text-white/75">Employee ID</p>
              <p className="text-base sm:text-xl font-bold">{user?.employee_code || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Announcements Banner */}
      {urgentAnnouncements.length > 0 && (
        <div className="rounded-xl sm:rounded-[20px] border-l-4 border-orange-500 bg-orange-50 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="mr-2 sm:mr-3 mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-orange-500" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-orange-800">Urgent Announcements</p>
                <div className="mt-1 space-y-1">
                  {urgentAnnouncements.slice(0, 2).map((announcement) => (
                    <p key={announcement.id} className="text-xs sm:text-sm text-orange-700">
                      • {announcement.title} - Expires soon!
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 sm:ml-auto"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatCard
          title="Pending Requests"
          value={stats.pendingLeaves}
          icon={ClockIcon}
          color="bg-yellow-500"
          subtext="Leave requests awaiting approval"
          onClick={() => navigate('/my-leave-requests')}
        />
        <StatCard
          title="Leave Balance"
          value={`${stats.leaveBalances.vacation_leave} days`}
          icon={BriefcaseIcon}
          color="bg-[#800080]"
          subtext="Vacation leave remaining"
          onClick={() => navigate('/my-leave-requests')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-800">Quick Actions</h2>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => navigate('/my-leave-requests')}
                className="flex w-full items-center justify-between rounded-lg sm:rounded-xl bg-[#f5e6f7] p-2.5 sm:p-3 transition-colors hover:bg-[#edd8ef]"
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                  <span className="text-xs sm:text-sm text-gray-700">Request Leave</span>
                </div>
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
              </button>

              <button
                onClick={() => navigate('/my-payslips')}
                className="flex w-full items-center justify-between rounded-lg sm:rounded-xl bg-[#f5e6f7] p-2.5 sm:p-3 transition-colors hover:bg-[#edd8ef]"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                  <span className="text-xs sm:text-sm text-gray-700">View Payslip</span>
                </div>
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
              </button>

              <button
                onClick={() => navigate('/my-profile')}
                className="flex w-full items-center justify-between rounded-lg sm:rounded-xl bg-[#f5e6f7] p-2.5 sm:p-3 transition-colors hover:bg-[#edd8ef]"
              >
                <div className="flex items-center">
                  <UserCircleIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                  <span className="text-xs sm:text-sm text-gray-700">My Profile</span>
                </div>
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
              </button>

              <button
                onClick={() => navigate('/announcements')}
                className="flex w-full items-center justify-between rounded-lg sm:rounded-xl bg-[#f5e6f7] p-2.5 sm:p-3 transition-colors hover:bg-[#edd8ef]"
              >
                <div className="flex items-center">
                  <MegaphoneIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                  <span className="text-xs sm:text-sm text-gray-700">View Announcements</span>
                </div>
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
              </button>
            </div>
          </div>

          {/* Leave Balance Details */}
          <div className="rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-800">Leave Balance</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Vacation Leave</span>
                  <span className="font-medium">{stats.leaveBalances.vacation_leave} days</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 sm:h-2 rounded-full bg-blue-500"
                    style={{ width: `${(stats.leaveBalances.vacation_leave / 15) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Sick Leave</span>
                  <span className="font-medium">{stats.leaveBalances.sick_leave} days</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 sm:h-2 rounded-full bg-green-500"
                    style={{ width: `${(stats.leaveBalances.sick_leave / 12) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* <div>
                <div className="mb-1 flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Emergency Leave</span>
                  <span className="font-medium">{stats.leaveBalances.emergency_leave} days</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 sm:h-2 rounded-full bg-yellow-500"
                    style={{ width: `${(stats.leaveBalances.emergency_leave / 5) * 100}%` }}
                  ></div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Recent Payslips</h2>
              <button
                onClick={() => navigate('/my-payslips')}
                className="text-xs sm:text-sm text-[#800080] hover:text-[#660066]"
              >
                View All →
              </button>
            </div>
            {recentPayslips.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No payslips available</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentPayslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="cursor-pointer rounded-lg sm:rounded-xl p-2 sm:p-3 transition hover:bg-[#faf5fb]"
                    onClick={() => navigate('/my-payslips')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-800">
                          {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Net: {formatCurrency(payslip.net_salary)}
                        </p>
                      </div>
                      <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Recent Leave Requests</h2>
              <button
                onClick={() => navigate('/my-leave-requests')}
                className="text-xs sm:text-sm text-[#800080] hover:text-[#660066]"
              >
                View All →
              </button>
            </div>
            {recentLeaves.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No leave requests</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentLeaves.map((leave) => (
                  <div key={leave.id} className="rounded-lg sm:rounded-xl p-2 sm:p-3 transition hover:bg-[#faf5fb]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-800">{leave.leave_type}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                        </p>
                      </div>
                      <span
                        className={`self-start sm:self-center rounded-full px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${
                          leave.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {leave.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-[#f5e6f7] p-4 sm:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="flex items-center text-base sm:text-lg font-semibold text-gray-800">
                <MegaphoneIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#800080]" />
                Latest Announcements
              </h2>
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center text-xs sm:text-sm text-[#800080] hover:text-[#660066]"
              >
                View All <ArrowRightIcon className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
            {announcements.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <MegaphoneIcon className="mx-auto mb-2 sm:mb-3 h-8 w-8 sm:h-12 sm:w-12 text-[#800080]" />
                <p className="text-xs sm:text-sm text-gray-500">No new announcements</p>
              </div>
            ) : (
              <div className="max-h-[400px] sm:max-h-[500px] space-y-3 sm:space-y-4 overflow-y-auto pr-1 sm:pr-2">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="cursor-pointer rounded-lg sm:rounded-xl border-l-4 border-[#800080] bg-white p-3 sm:p-4 transition hover:shadow-sm"
                    onClick={() => navigate('/announcements')}
                  >
                    <p className="text-xs sm:text-sm font-semibold text-gray-800">{announcement.title}</p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {announcement.content.length > 80
                        ? `${announcement.content.substring(0, 80)}...`
                        : announcement.content}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {formatAnnouncementDate(announcement.created_at)}
                      </p>
                      {announcement.expires_at &&
                        new Date(announcement.expires_at) <
                          new Date(new Date().setDate(new Date().getDate() + 3)) && (
                          <span className="text-[10px] sm:text-xs text-orange-500">Expiring soon</span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="rounded-xl sm:rounded-[24px] border border-[#e6cce6] bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          <button
            onClick={() => navigate('/announcements')}
            className="text-xs sm:text-sm text-gray-600 hover:text-[#800080]"
          >
            All Announcements
          </button>
          <button
            onClick={() => navigate('/my-profile')}
            className="text-xs sm:text-sm text-gray-600 hover:text-[#800080]"
          >
            My Profile
          </button>
          <button
            onClick={() => navigate('/my-leave-requests')}
            className="text-xs sm:text-sm text-gray-600 hover:text-[#800080]"
          >
            Leave Requests
          </button>
          <button
            onClick={() => navigate('/my-payslips')}
            className="text-xs sm:text-sm text-gray-600 hover:text-[#800080]"
          >
            Payslips
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;