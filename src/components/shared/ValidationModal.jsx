// src/components/shared/ValidationModal.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ValidationModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Missing Required Fields
            </h3>
            <p className="text-gray-600 mb-4">
              Please fill in all required fields:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Name</li>
              <li>Category</li>
              <li>Display Group</li>
            </ul>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;