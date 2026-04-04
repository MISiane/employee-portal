import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Employees from './pages/Employees';
import MyProfile from './pages/MyProfile';
import MyAttendance from './pages/MyAttendance';
import MyLeaveRequests from './pages/MyLeaveRequests';
import MyPayslips from './pages/MyPayslips';
import Announcements from './pages/Announcements';
import LeaveRequestsAdmin from './pages/LeaveRequestsAdmin';
import AttendanceAdmin from './pages/AttendanceAdmin';
import AdminPayslips from './pages/AdminPayslips';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import CompanyPolicies from './pages/CompanyPolicies';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role-based Dashboard Component
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  return isAdmin ? <Dashboard /> : <EmployeeDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<RoleBasedDashboard />} />
              
              {/* Admin Only Routes */}
              <Route path="employees" element={<Employees />} />
              <Route path="leave-requests" element={<LeaveRequestsAdmin />} />
              <Route path="attendance" element={<AttendanceAdmin />} />
              <Route path="payslips" element={<AdminPayslips />} />
              <Route path="reports" element={<Reports />} />
              
              {/* Employee Only Routes */}
              <Route path="my-profile" element={<MyProfile />} />
              <Route path="my-attendance" element={<MyAttendance />} />
              <Route path="my-leave-requests" element={<MyLeaveRequests />} />
              <Route path="my-payslips" element={<MyPayslips />} />
              
              {/* Shared Routes */}
              <Route path="announcements" element={<Announcements />} />
              <Route path="settings" element={<Settings />} />
              <Route path="/policies" element={<CompanyPolicies />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;