import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, employeeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
          Deactivate Employee
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to deactivate {employeeName}? 
          This will:
          <ul className="text-left text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Prevent them from logging in</li>
            <li>Keep all their historical data intact</li>
            <li>Allow reactivation later if needed</li>
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
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;