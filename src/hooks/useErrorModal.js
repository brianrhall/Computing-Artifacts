// Create this file at: src/hooks/useErrorModal.js

import { useState, useCallback } from 'react';

export const useErrorModal = () => {
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  const showErrorModal = useCallback((message, title = 'Error') => {
    setError({ message, title });
    setShowError(true);
  }, []);

  const hideErrorModal = useCallback(() => {
    setShowError(false);
    // Clear error after animation
    setTimeout(() => setError(null), 300);
  }, []);

  return {
    error,
    showError,
    showErrorModal,
    hideErrorModal
  };
};