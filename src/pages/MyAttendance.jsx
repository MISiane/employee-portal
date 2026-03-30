import { useState } from 'react';
import { ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

const MyAttendance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-600 mt-1">View your attendance records</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Attendance Feature Coming Soon</h3>
        <p className="text-gray-500">
          This feature is currently under development. Please check back later.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          For attendance inquiries, please contact HR department.
        </p>
      </div>
    </div>
  );
};

export default MyAttendance;