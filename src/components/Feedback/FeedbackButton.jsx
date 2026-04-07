import { useState } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FeedbackModal from './FeedbackModal';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#800080] text-white p-4 rounded-full shadow-lg hover:bg-[#660066] transition-all duration-300 hover:scale-110"
        title="Submit Feedback"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
      </button>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FeedbackButton;