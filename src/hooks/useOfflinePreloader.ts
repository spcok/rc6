import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUKLocalDate } from '../services/temporalService';
import { useAuthStore } from '../store/authStore';

export const useOfflinePreloader = () => {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();

  useEffect(() => {
    if (!session || !navigator.onLine) return;

    const prefetchCriticalData = async () => {
      console.log('🔄 Preloading critical offline data to IndexedDB...');
      
      // 1. Preload Active Animals
      await queryClient.prefetchQuery({
        queryKey: ['animals'],
        queryFn: async () => {
          const { data } = await supabase.from('animals').select('*').eq('status', 'ACTIVE');
          return data || [];
        },
        staleTime: 1000 * 60 * 60 * 24 // Consider fresh for 24 hours
      });

      // 2. Preload Operational Lists
      await queryClient.prefetchQuery({
        queryKey: ['operational_lists'],
        queryFn: async () => {
          const { data } = await supabase.from('operational_lists').select('*').eq('is_deleted', false);
          return data || [];
        }
      });

      // 3. Preload Today's Logs
      const today = getUKLocalDate();
      await queryClient.prefetchQuery({
        queryKey: ['daily_logs', 'today', undefined],
        queryFn: async () => {
          const { data } = await supabase.from('daily_logs').select('*').eq('log_date', today).eq('is_deleted', false);
          return data || [];
        }
      });

      console.log('✅ Offline cache hydrated successfully.');
    };

    prefetchCriticalData();
  }, [session, queryClient]);
};
