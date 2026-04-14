// src/components/ToastNotification.jsx
import React, { useEffect } from 'react';
import { Bell, CheckCircle, XCircle } from 'lucide-react';

const ToastNotification = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  const styles = { 
    success: "bg-green-500 text-white", 
    error: "bg-red-500 text-white", 
    info: "bg-blue-500 text-white" 
  };
  
  const icons = { 
    success: <CheckCircle size={20} />, 
    error: <XCircle size={20} />, 
    info: <Bell size={20} /> 
  };
  
  return (
    <div className={`fixed top-5 left-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform duration-500 ease-in-out ${styles[type] || styles.info} animate-bounce-in`}>
      {icons[type]}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

export default ToastNotification;