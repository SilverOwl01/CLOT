// src/hooks/useToast.js
import { useState } from 'react';

const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  return { toast, showToast, hideToast };
};

export default useToast;