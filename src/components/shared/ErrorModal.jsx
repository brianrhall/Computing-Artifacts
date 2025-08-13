// Create this file at: src/components/shared/ErrorModal.jsx

import React, { useEffect } from 'react';
import { XCircle, X } from 'lucide-react';

const ErrorModal = ({ 
  title = 'Error', 
  message, 
  onClose, 
  autoClose = false,
  autoCloseDelay = 5000,
  showCloseButton = true 
}) => {
  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full animate-fade-in-up">
        <div className="p-6">
          {/* Header with close button */}
          {showCloseButton && (
            <div className="flex justify-end mb-2">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
          
          {/* Error icon and content */}
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          
          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;