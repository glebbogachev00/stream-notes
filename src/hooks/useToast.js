import { useState, useCallback, useRef, useEffect } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Set());

  const showToast = useCallback((message, duration = 2000) => {
    const id = Date.now().toString();
    const toast = { id, message, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after duration
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutsRef.current.delete(timeoutId);
    }, duration);
    
    timeoutsRef.current.add(timeoutId);
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  return {
    toasts,
    showToast,
    hideToast
  };
};