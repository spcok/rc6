import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Holiday } from '../../types';
import { holidaysCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export function useHolidayData() {
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('holidays').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: Holiday[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Holiday>(item));
        
        for (const item of mappedData) {
          try {
            await holidaysCollection.update(item);
          } catch {
            await holidaysCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving holidays from local vault.");
        return await holidaysCollection.getAll();
      }
    }
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
      const payload = { ...holiday, id: crypto.randomUUID(), isDeleted: false } as Holiday;
      try {
        const { error } = await supabase.from('holidays').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding holiday locally.");
      }
      await holidaysCollection.insert(payload);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = holidays.find(h => h.id === id);
      if (existing) {
        const updated = { ...existing, isDeleted: true } as Holiday;
        try {
          const { error } = await supabase.from('holidays').update({ is_deleted: true }).eq('id', id);
          if (error) throw error;
        } catch {
          console.warn("Offline: Deleting holiday locally.");
        }
        await holidaysCollection.update(updated);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  return {
    holidays: holidays.filter(h => !h.isDeleted),
    isLoading,
    addHoliday: addHolidayMutation.mutateAsync,
    deleteHoliday: deleteHolidayMutation.mutateAsync,
  };
}
