// src/components/gallery/SuccessModal.jsx
import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const SuccessModal = ({ name, action, onClose }) => {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl p-6 flex items-center gap-4 pointer-events-auto transform transition-all animate-fade-in">
        <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-gray-900">Success!</h3>
          <p className="text-gray-600">
            <span className="font-medium">{name}</span> has been {action} successfully.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;