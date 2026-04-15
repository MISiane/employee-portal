import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  CalendarIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  GiftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import api from '../api/config';
import { getLatestAnnouncements } from '../api/announcements';
import { getUpcomingBirthdays } from '../api/employees';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    pendingApprovals: 0,
    announcements: 0,
    newEmployeesThisMonth: 0,
    totalPayslipsThisMonth: 0,
    departmentsCount: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [recentLeaveRequests, setRecentLeaveRequests] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        employeesData,
        leaveRequestsData,
        announcementsData,
        departmentDistribution,
        payslipsData,
        latestAnnouncements
      ] = await Promise.all([
        api.get('/employees/stats'),
        api.get('/leave/all-requests', { params: { limit: 5, status: 'pending' } }),
        api.get('/announcements', { params: { limit: 5 } }),
        api.get('/employees/department-distribution'),
        api.get('/payslips', { params: { limit: 1, month: new Date().getMonth() + 1 } }),
        getLatestAnnouncements(5).catch(() => [])
      ]);

      const deptStats = departmentDistribution.data || [];
      setDepartmentStats(deptStats);
      setRecentAnnouncements(latestAnnouncements || []);

      const departmentsCount = deptStats.filter(d => d.count > 0).length;
      const totalEmployees = employeesData.data.total || 0;
      const activeEmployees = employeesData.data.active || 0;
      const pendingLeaves = leaveRequestsData.data.leaveRequests?.length || 0;
      const recentLeaves = leaveRequestsData.data.leaveRequests || [];
      const announcements = announcementsData.data || [];

      const activities = [
        ...recentLeaves.slice(0, 3).map(leave => ({
          id: `leave-${leave.id}`,
          type: 'leave',
          user: `${leave.first_name} ${leave.last_name}`,
          action: `requested ${leave.leave_type}`,
          time: new Date(leave.created_at).toLocaleString(),
          status: leave.status,
          icon: CalendarIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          onClick: () => navigate('/leave-requests')
        })),
        ...latestAnnouncements.slice(0, 2).map(ann => ({
          id: `ann-${ann.id}`,
          type: 'announcement',
          user: ann.first_name ? `${ann.first_name} ${ann.last_name}` : 'HR Department',
          action: `posted: ${ann.title}`,
          time: new Date(ann.created_at).toLocaleString(),
          status: 'new',
          icon: MegaphoneIcon,
          color: 'text-[#800080]',
          bgColor: 'bg-[#f5e6f7]',
          onClick: () => navigate('/announcements')
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      setStats({
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        pendingApprovals: pendingLeaves,
        announcements: announcements.length,
        newEmployeesThisMonth: employeesData.data?.newThisMonth || 0,
        totalPayslipsThisMonth: payslipsData.data?.payslips?.length || 0,
        departmentsCount
      });

      setRecentActivities(activities);
      setRecentLeaveRequests(recentLeaves.slice(0, 3));

      const upcomingBirthdaysData = await getUpcomingBirthdays().catch(() => []);
      setUpcomingBirthdays(upcomingBirthdaysData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalEmployees: 128,
        activeEmployees: 124,
        pendingLeaves: 12,
        pendingApprovals: 12,
        announcements: 3,
        newEmployeesThisMonth: 4,
        totalPayslipsThisMonth: 42,
        departmentsCount: 7
      });

      setDepartmentStats([
        { department: 'Admin', count: 5 },
        { department: 'Frontoffice', count: 8 },
        { department: 'Food and Beverage', count: 12 },
        { department: 'Kitchen', count: 15 },
        { department: 'Bakeshop', count: 6 },
        { department: 'Housekeeping', count: 10 },
        { department: 'Engineering and Maintenance', count: 7 }
      ]);

      setRecentActivities([
        {
          id: 'mock-1',
          type: 'leave',
          user: 'John Doe',
          action: 'requested sick leave',
          time: '2 hours ago',
          status: 'pending',
          icon: CalendarIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, color, onClick, subtext }) => (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-[28px] border border-[#e6cce6] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(128,0,128,0.22)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
          {change && (
            <div className="mt-2 flex items-center">
              {changeType === 'increase' ? (
                <ArrowTrendingUpIcon className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {change} from last month
              </span>
            </div>
          )}
        </div>
        <div className={`${color} rounded-2xl p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-[28px] bg-[#f5e6f7]">
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <div className="animate-pulse rounded-2xl bg-[#800080] p-5 shadow-lg">
              <ChartBarIcon className="h-12 w-12 animate-bounce text-white" />
            </div>
          </div>
          <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-[#800080]" />
          <div>
            <p className="text-lg font-semibold text-gray-700">Loading Dashboard</p>
            <p className="text-sm text-[#800080]">Preparing your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] bg-[#800080] p-6 text-white shadow-[0_20px_60px_-20px_rgba(128,0,128,0.45)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold">
              {getGreeting()}, {user?.first_name}! 👋
            </h1>
            <p className="text-white/85">
              Welcome to your admin dashboard. Here's an overview of your organization.
            </p>
            {stats.pendingApprovals > 0 && (
              <div className="mt-3 inline-flex items-center space-x-2 rounded-lg bg-white/20 px-3 py-1.5">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span className="text-sm">
                  {stats.pendingApprovals} pending {stats.pendingApprovals === 1 ? 'request' : 'requests'} need your attention
                </span>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium">Today's Date</p>
              <p className="text-2xl font-bold">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={UserGroupIcon}
          change={`+${stats.newEmployeesThisMonth}`}
          changeType="increase"
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          icon={CheckBadgeIcon}
          subtext={`${Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}% of total`}
          color="bg-gradient-to-r from-green-500 to-green-600"
          onClick={() => navigate('/employees?status=active')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={DocumentTextIcon}
          change={stats.pendingApprovals > 0 ? `+${stats.pendingApprovals}` : '0'}
          changeType="increase"
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          onClick={() => navigate('/leave-requests?status=pending')}
        />
        {/* <StatCard
          title="Departments"
          value={stats.departmentsCount}
          icon={BriefcaseIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          onClick={() => navigate('/employees')}
        /> */}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#e6cce6] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)]">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
              <UserGroupIcon className="mr-2 h-5 w-5 text-[#800080]" />
              Department Distribution
            </h2>
            <div className="space-y-3">
              {departmentStats.length > 0 ? (
                departmentStats.map((dept, index) => (
                  <div key={dept.department || `dept-${index}`}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-600">{dept.department}</span>
                      <span className="font-medium text-gray-800">{dept.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f3e6f4]">
                      <div
                        className="h-2 rounded-full bg-[#800080]"
                        style={{ width: `${(dept.count / stats.totalEmployees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">No department data available</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e6cce6] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)]">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/employees')}
                className="flex items-center justify-center space-x-2 rounded-xl bg-[#800080] p-3 text-white transition hover:bg-[#660066]"
              >
                <UsersIcon className="h-5 w-5 text-blue-300" />
                <span className="font-medium">Add Employee</span>
              </button>

              <button
                onClick={() => navigate('/leave-requests')}
                className="flex items-center justify-center space-x-2 rounded-xl bg-[#800080] p-3 text-white transition hover:bg-[#660066]"
              >
                <CalendarIcon className="h-5 w-5 text-green-300" />
                <span className="font-medium">Review Leaves</span>
              </button>

              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center justify-center space-x-2 rounded-xl bg-[#800080] p-3 text-white transition hover:bg-[#660066]"
              >
                <MegaphoneIcon className="h-5 w-5 text-purple-300" />
                <span className="font-medium">Post Announcement</span>
              </button>

              <button
                onClick={() => navigate('/payslips')}
                className="flex items-center justify-center space-x-2 rounded-xl bg-[#800080] p-3 text-white transition hover:bg-[#660066]"
              >
                <CurrencyDollarIcon className="h-5 w-5 text-orange-300" />
                <span className="font-medium">Generate Payslip</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#e6cce6] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-800">
                <ClockIcon className="mr-2 h-5 w-5 text-[#800080]" />
                Recent Activities
              </h2>
              <button
                onClick={() => navigate('/announcements')}
                className="text-sm font-medium text-[#800080] hover:text-[#660066]"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={activity.onClick}
                    className="flex cursor-pointer items-start space-x-3 rounded-xl p-3 transition-colors hover:bg-[#f9f1fa]"
                  >
                    <div className={`${activity.bgColor} rounded-lg p-2`}>
                      <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-[#f5e6f7] text-[#800080]'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-gray-500">No recent activities</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e6cce6] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-800">
                <CalendarIcon className="mr-2 h-5 w-5 text-[#800080]" />
                Pending Leave Requests
              </h2>
              <button
                onClick={() => navigate('/leave-requests?status=pending')}
                className="flex items-center text-sm font-medium text-[#800080] hover:text-[#660066]"
              >
                View All <ChevronRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentLeaveRequests.length > 0 ? (
                recentLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition hover:bg-[#f9f1fa]"
                    onClick={() => navigate('/leave-requests')}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{request.first_name} {request.last_name}</p>
                      <p className="text-sm text-gray-500">{request.leave_type}</p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Pending
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">No pending leave requests</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#e6cce6] bg-[#f5e6f7] p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.14)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-800">
                <MegaphoneIcon className="mr-2 h-5 w-5 text-[#800080]" />
                Latest Announcements
              </h2>
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center text-sm font-medium text-[#800080] hover:text-[#660066]"
              >
                View All <ChevronRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="cursor-pointer rounded-lg border border-[#ead5ec] bg-white p-3 transition hover:shadow-sm"
                    onClick={() => navigate('/announcements')}
                  >
                    <p className="text-sm font-medium text-gray-800">{announcement.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {announcement.content?.length > 80
                        ? `${announcement.content.substring(0, 80)}...`
                        : announcement.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatAnnouncementDate(announcement.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">No recent announcements</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e6cce6] bg-[#f5e6f7] p-6 shadow-[0_10px_30px_-18px_rgba(128,0,128,0.14)]">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
              <GiftIcon className="mr-2 h-5 w-5 text-[#800080]" />
              Upcoming Birthdays
            </h2>
            <div className="space-y-3">
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.map((birthday, index) => (
                  <div key={birthday.name || `birthday-${index}`} className="flex items-center space-x-3 rounded-xl bg-white p-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#800080] font-semibold text-white">
                      {birthday.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{birthday.name}</p>
                      <p className="text-xs text-gray-500">{birthday.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#800080]">{birthday.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">No upcoming birthdays</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;