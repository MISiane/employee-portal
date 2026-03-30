import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ReactivateConfirmModal = ({ isOpen, onClose, onConfirm, employeeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
          Reactivate Employee
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to reactivate {employeeName}?
          This will:
          <ul className="text-left text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Restore their account access</li>
            <li>Allow them to log in again</li>
            <li>All historical data remains unchanged</li>
          </ul>
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Reactivate
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactivateConfirmModal;