import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TriviaModal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        className="relative my-4 w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default TriviaModal;
