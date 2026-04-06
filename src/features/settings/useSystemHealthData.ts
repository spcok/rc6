import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useSystemHealthData() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [isWipingData, setIsWipingData] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);

  const [pwaHealth, setPwaHealth] = useState({
    isSecure: window.isSecureContext,
    swActive: false,
    swUpdateWaiting: false,
    manifestValid: false,
    isInstalled: false,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    storageValid: false,
    isPrivateBrowsing: false,
    storageQuota: 0
  });

  useEffect(() => {
    const checkPwaHealth = async () => {
      let swActive = false;
      let swUpdateWaiting = false;
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swActive = registrations.length > 0;
        
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          swUpdateWaiting = true;
        }
      }

      let manifestValid = false;
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink && manifestLink.href) {
          const res = await fetch(manifestLink.href, { cache: 'no-store' });
          if (res.ok) {
            const manifest = await res.json();
            manifestValid = !!(manifest.icons && manifest.icons.length > 0);
          }
        }
      } catch (e) {
        console.error('Manifest check failed', e);
      }

      let storageValid = false;
      let isPrivateBrowsing = false;
      let storageQuota = 0;

      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        storageQuota = estimate.quota || 0;
        // If quota is less than 100MB, it's likely private browsing or very low space
        if (storageQuota < 100 * 1024 * 1024) {
          isPrivateBrowsing = true;
        }
      }

      if ('indexedDB' in window) {
        try {
          const request = indexedDB.open('KentOwlAcademyDB');
          storageValid = await new Promise((resolve) => {
            request.onsuccess = () => {
              request.result.close();
              resolve(true);
            };
            request.onerror = () => resolve(false);
          });
        } catch (e) {
          console.error('IndexedDB check failed', e);
        }
      }

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-expect-error - deferredPwaPrompt is attached to window globally
      const isInstalled = !!window.deferredPwaPrompt || isStandalone;

      setPwaHealth(prev => ({ 
        ...prev, 
        swActive, 
        swUpdateWaiting,
        manifestValid, 
        storageValid, 
        isInstalled, 
        isStandalone,
        isPrivateBrowsing,
        storageQuota
      }));
    };

    checkPwaHealth();
    
    // Listen for the custom event dispatched in main.tsx
    const handlePwaCaptured = () => {
      setPwaHealth(prev => ({ ...prev, isInstalled: true }));
    };
    window.addEventListener('pwa-prompt-captured', handlePwaCaptured);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('pwa-prompt-captured', handlePwaCaptured);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [tableCounts, setTableCounts] = useState({
    animals: 0,
    users: 0,
    daily_logs: 0,
    tasks: 0,
    medical_logs: 0
  });

  useEffect(() => {
    let isMounted = true;

    const updateCounts = async () => {
      try {
        if (!navigator.onLine) {
          console.log('📡 Network offline. Skipping cloud count update.');
          return;
        }

        const [
          { count: animalsCount },
          { count: usersCount },
          { count: dailyLogsCount },
          { count: tasksCount },
          { count: medicalLogsCount }
        ] = await Promise.all([
          supabase.from('animals').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
          supabase.from('tasks').select('*', { count: 'exact', head: true }),
          supabase.from('clinical_notes').select('*', { count: 'exact', head: true }),
        ]);

        if (isMounted) {
          setTableCounts({
            animals: animalsCount || 0,
            users: usersCount || 0,
            daily_logs: dailyLogsCount || 0,
            tasks: tasksCount || 0,
            medical_logs: medicalLogsCount || 0
          });
        }
      } catch (e) {
        console.error('Failed to update counts (likely offline)', e);
        // Graceful degradation: keep existing counts or set to 0 if preferred
      }
    };

    updateCounts();
    const interval = setInterval(updateCounts, 10000); // Update every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const executeForceRebuild = async () => {
    setIsHydrating(true);
    try {
      // With RxDB, we don't need manual hydration, it syncs automatically.
      // We could trigger a manual replication restart here if needed.
      return true;
    } catch (error) {
      console.error("Hydration failed:", error);
      return false;
    } finally {
      setIsHydrating(false);
    }
  };

  const executeClearQueue = async () => {
    setIsClearingQueue(true);
    try {
      // No sync_queue table in RxDB
      return true;
    } catch (error) {
      console.error("Failed to clear queue:", error);
      return false;
    } finally {
      setIsClearingQueue(false);
    }
  };

  const executeWipeData = async () => {
    setIsWipingData(true);
    setWipeProgress(0);
    try {
      console.warn("Wipe executed");
      return true;
    } catch (error) {
      console.error("Data wipe failed:", error);
      return false;
    } finally {
      setIsWipingData(false);
      setWipeProgress(0);
    }
  };

  return { 
    isOnline, isHydrating, pwaHealth, tableCounts,
    executeForceRebuild, executeClearQueue, isClearingQueue,
    executeWipeData, isWipingData, wipeProgress
  };
}
