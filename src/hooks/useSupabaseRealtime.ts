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
          
          // Phase 3 Fix: Explicit routing only. No blanket invalidations.
          const routeMap: Record<string, string[]> = {
            'animals': ['animals', 'animal'],
            'daily_logs': ['dailyLogs'],
            'tasks': ['tasks'],
            'clinical_notes': ['clinical_notes'],
            'mar_charts': ['mar_charts'],
            'quarantine_records': ['quarantine_records'],
            'timesheets': ['timesheets'],
            'movements': ['movements'],
            'transfers': ['transfers'],
            'maintenance': ['maintenance'],
            'safety_drills': ['safetyDrills'],
            'incidents': ['incidents'],
            'first_aid': ['firstAid'],
            'users': ['users'],
            'role_permissions': ['role_permissions']
          };

          const keysToInvalidate = routeMap[table];
          if (keysToInvalidate) {
            keysToInvalidate.forEach(key => {
              queryClient.invalidateQueries({ queryKey: [key] });
            });
          } else {
             console.warn(`No cache route mapped for table: ${table}. Ignoring realtime event to prevent cache thrashing.`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};