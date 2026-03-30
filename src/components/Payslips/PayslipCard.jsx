import { useState } from 'react';
import { DocumentTextIcon, CalendarIcon, CurrencyDollarIcon, EyeIcon } from '@heroicons/react/24/outline';

const PayslipCard = ({ payslip, onView }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
              </h3>
              <p className="text-xs text-gray-500">
                Pay Date: {formatDate(payslip.pay_date)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            payslip.status === 'paid' ? 'bg-green-100 text-green-800' :
            payslip.status === 'sent' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {payslip.status.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Gross Salary</p>
            <p className="text-lg font-semibold text-gray-800">{formatCurrency(payslip.gross_salary)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net Salary</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(payslip.net_salary)}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {payslip.items?.length || 0} items
          </div>
          <button
            onClick={() => onView(payslip)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipCard;