import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const SuccessModal = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full animate-fade-in">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-center mb-2">Success!</h3>
        <p className="text-gray-600 text-center">{message}</p>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;