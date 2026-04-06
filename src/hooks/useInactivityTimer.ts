import { useIdleTimer } from 'react-idle-timer';
import { useAuthStore } from '../store/authStore';

export const useInactivityTimer = (timeoutMinutes = 15) => {
  const { logout, currentUser } = useAuthStore();

  useIdleTimer({
    timeout: timeoutMinutes * 60 * 1000,
    onIdle: () => {
      if (currentUser) {
        console.warn(`[Security] User idle for ${timeoutMinutes} minutes. Forcing logout for ZLA compliance.`);
        logout();
      }
    },
    debounce: 500,
    crossTab: true // Syncs activity across multiple browser tabs
  });
};
