import { useState, useEffect } from 'react';
import { evaluateZlaCompliance } from '../services/temporalService';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Track compliance state with initial value from localStorage if offline
  const [compliance, setCompliance] = useState(() => {
    if (!navigator.onLine) {
      const lastSync = localStorage.getItem('koa_last_sync_timestamp');
      return evaluateZlaCompliance(lastSync);
    }
    return {
      isCompliant: true,
      daysRemaining: 14,
      daysOffline: 0
    };
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When online, record the fresh sync time
      localStorage.setItem('koa_last_sync_timestamp', new Date().toISOString());
      setCompliance({ isCompliant: true, daysRemaining: 14, daysOffline: 0 });
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Evaluate compliance immediately upon losing connection
      const lastSync = localStorage.getItem('koa_last_sync_timestamp');
      setCompliance(evaluateZlaCompliance(lastSync));
    };

    // Initial sync timestamp update if online
    if (navigator.onLine) {
       localStorage.setItem('koa_last_sync_timestamp', new Date().toISOString());
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically re-evaluate compliance if we are offline for a long time
    const complianceCheckInterval = setInterval(() => {
      if (!navigator.onLine) {
        const lastSync = localStorage.getItem('koa_last_sync_timestamp');
        setCompliance(evaluateZlaCompliance(lastSync));
      }
    }, 1000 * 60 * 60); // Check every hour

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(complianceCheckInterval);
    };
  }, []);

  return { 
    isOnline, 
    isCompliant: compliance.isCompliant,
    daysRemaining: compliance.daysRemaining,
    daysOffline: compliance.daysOffline,
    zlaLockout: !compliance.isCompliant
  };
};
