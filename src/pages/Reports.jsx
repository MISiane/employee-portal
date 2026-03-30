import { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon 
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleGenerateReport = () => {
    console.log('Generating report:', { reportType, dateRange });
    alert('Report generation started! This would download a report in production.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and download various reports</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Report</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setReportType('attendance')}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  reportType === 'attendance'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="font-medium text-gray-800">Attendance Report</p>
                <p className="text-xs text-gray-500 mt-1">Daily/Weekly/Monthly attendance</p>
              </button>
              
              <button
                onClick={() => setReportType('leave')}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  reportType === 'leave'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CalendarIcon className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-gray-800">Leave Report</p>
                <p className="text-xs text-gray-500 mt-1">Leave requests summary</p>
              </button>
              
              <button
                onClick={() => setReportType('employee')}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  reportType === 'employee'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="font-medium text-gray-800">Employee Report</p>
                <p className="text-xs text-gray-500 mt-1">Employee directory summary</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Reports</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">March 2024 - Attendance Summary</p>
              <p className="text-sm text-gray-500">Generated on March 20, 2024</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700">
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Q1 2024 - Leave Report</p>
              <p className="text-sm text-gray-500">Generated on March 15, 2024</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700">
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;