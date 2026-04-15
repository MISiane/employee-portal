import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getPayslips } from '../api/payslips';
import PayslipViewModal from '../components/Payslips/ViewPayslipModal';

const MyPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchPayslips();
  }, [selectedYear, selectedMonth, pagination.page]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 12
      };
      
      if (selectedYear && selectedYear !== '') {
        params.year = selectedYear;
      }
      
      if (selectedMonth && selectedMonth !== '') {
        params.month = selectedMonth;
      }
      
      const data = await getPayslips(params);
      setPayslips(data.payslips || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setShowModal(true);
  };

  const handleDownload = async (e, payslipId) => {
    e.stopPropagation();
    try {
      const { downloadPayslip } = await import('../api/payslips');
      await downloadPayslip(payslipId);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Error downloading payslip. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const years = ['', ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)];
  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const calculateYearToDate = () => {
    return payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  };

  const getLatestNetSalary = () => {
    if (payslips.length === 0) return 0;
    const sorted = [...payslips].sort((a, b) => 
      new Date(b.pay_period_end) - new Date(a.pay_period_end)
    );
    return sorted[0].net_salary || 0;
  };

  const resetFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilters(false);
  };

  const hasActiveFilters = selectedYear || selectedMonth;

  const PayslipCard = ({ payslip }) => (
    <div 
      onClick={() => handleViewPayslip(payslip)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                {formatShortDate(payslip.pay_period_start)} - {formatShortDate(payslip.pay_period_end)}
              </h3>
              <p className="text-xs text-gray-500">
                Pay Date: {formatShortDate(payslip.pay_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={(e) => handleDownload(e, payslip.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="Download PDF"
            >
              <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
              payslip.status === 'paid' ? 'bg-green-100 text-green-800' :
              payslip.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {payslip.status?.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Salary Info */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <p className="text-xs text-gray-500">Gross Salary</p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">{formatCurrency(payslip.gross_salary)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net Salary</p>
            <p className="text-base sm:text-lg font-semibold text-green-600">{formatCurrency(payslip.net_salary)}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Days Present: {payslip.days_present || 0}
          </div>
          <button className="text-blue-600 group-hover:text-blue-700 text-xs sm:text-sm font-medium">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && payslips.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ArrowPathIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-500">Loading your payslips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Payslips</h1>
          <p className="text-sm text-gray-600 mt-1">View and download your monthly payslips</p>
        </div>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center justify-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters {hasActiveFilters && `(${selectedYear || selectedMonth ? '1' : '0'})`}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Payslips</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{pagination.total}</p>
            </div>
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Latest Net Salary</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">{formatCurrency(getLatestNetSalary())}</p>
            </div>
            <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>
        
        {/* <div className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Year-to-Date</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{formatCurrency(calculateYearToDate())}</p>
            </div>
            <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </div> */}
      </div>

      {/* Filters - Desktop (visible), Mobile (collapsible) */}
      <div className={`bg-white rounded-xl shadow-sm p-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {years.map(year => (
                <option key={year || 'all'} value={year}>{year || 'All Years'}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payslips Grid */}
      {payslips.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No payslips found</h3>
          <p className="text-sm text-gray-500">
            {hasActiveFilters 
              ? 'No payslips found for the selected filters. Try clearing the filters.'
              : 'No payslips available yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {payslips.map((payslip) => (
              <PayslipCard key={payslip.id} payslip={payslip} />
            ))}
          </div>

          {/* Pagination - Responsive */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Page
                </span>
                <span className="px-3 py-1 text-sm font-medium text-gray-800">
                  {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Payslip Detail Modal */}
      <PayslipViewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        payslip={selectedPayslip}
      />
    </div>
  );
};

export default MyPayslips;