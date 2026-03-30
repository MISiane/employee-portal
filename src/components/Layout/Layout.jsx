import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 overflow-hidden">
      {/* Sidebar - static on desktop, hidden on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - stays at top */}
        <div className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-purple-100 shadow-sm">
          <Header />
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;