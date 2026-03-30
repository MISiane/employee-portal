import { useState } from 'react';
import { BellIcon, ShieldCheckIcon, GlobeAltIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  const [theme, setTheme] = useState('light');

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-6">
            <div className="space-y-1">
              <button className="w-full text-left px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                Notifications
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                Security
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                Appearance
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Profile Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="john.doe@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-blue-600" />
              Notification Preferences
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive browser notifications</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Security
            </h2>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Change Password
              </button>
              <button className="w-full px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;