import { useState } from 'react';
import { 
  ClockIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const AttendanceAdmin = () => {
  const [attendance, setAttendance] = useState([
    { id: 1, name: 'John Doe', check_in: '09:00 AM', check_out: '06:00 PM', status: 'present', department: 'Engineering' },
    { id: 2, name: 'Jane Smith', check_in: '09:15 AM', check_out: '06:00 PM', status: 'late', department: 'Marketing' },
    { id: 3, name: 'Mike Johnson', check_in: '09:00 AM', check_out: '05:30 PM', status: 'present', department: 'Sales' },
    { id: 4, name: 'Sarah Williams', check_in: null, check_out: null, status: 'absent', department: 'HR' },
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'present':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Present</span>;
      case 'late':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Late</span>;
      case 'absent':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Absent</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        <p className="text-gray-600 mt-1">Track and manage employee attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Present Today</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {attendance.filter(a => a.status === 'present').length}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Late Arrivals</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {attendance.filter(a => a.status === 'late').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {attendance.filter(a => a.status === 'absent').length}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Today's Attendance</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {record.name.charAt(0)}
                        </span>
                      </div>
                      <span className="ml-3 text-sm text-gray-900">{record.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.check_in || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.check_out || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;