import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useSupabaseRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Realtime change received:', payload);
          const table = payload.table;
          
          // Invalidate relevant queries based on the table
          if (table === 'animals') {
            queryClient.invalidateQueries({ queryKey: ['animals'] });
            queryClient.invalidateQueries({ queryKey: ['animal'] });
          } else if (table === 'daily_logs') {
            queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
          } else if (table === 'tasks') {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          } else if (table === 'clinical_notes') {
            queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] });
          } else if (table === 'mar_charts') {
            queryClient.invalidateQueries({ queryKey: ['marCharts'] });
          } else if (table === 'quarantine_records') {
            queryClient.invalidateQueries({ queryKey: ['quarantineRecords'] });
          } else if (table === 'timesheets') {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
          } else {
            // Fallback: invalidate everything if we're not sure
            queryClient.invalidateQueries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};