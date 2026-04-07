import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shift } from '../../types';
import { rotaCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useRotaData = () => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ['rota'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('rota').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: Shift[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Shift>(item));
        
        for (const item of mappedData) {
          try {
            await rotaCollection.update(item);
          } catch {
            await rotaCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving rota from local vault.");
        return await rotaCollection.getAll();
      }
    }
  });

  const addShiftMutation = useMutation({
    onMutate: async (shift: Partial<Shift>) => {
      const payload = {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as Shift;
      await rotaCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (shift: Partial<Shift>, variables, context) => {
      const payload = (context as any)?.payload || {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const { error } = await supabase.from('rota').insert([payload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  const updateShiftMutation = useMutation({
    onMutate: async (shift: Partial<Shift>) => {
      const existing = shifts.find(s => s.id === shift.id);
      if (existing) {
        const updated = { ...existing, ...shift } as Shift;
        await rotaCollection.update(updated as Shift & { id: string });
      }
    },
    mutationFn: async (shift: Partial<Shift>) => {
      if (!shift.id) throw new Error("Missing shift ID");
      const { error } = await supabase.from('rota').update(shift).eq('id', shift.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  const deleteShiftMutation = useMutation({
    onMutate: async (id: string) => {
      const existing = shifts.find(s => s.id === id);
      if (existing) {
        const updated = { ...existing, isDeleted: true } as Shift;
        await rotaCollection.update(updated as Shift & { id: string });
      }
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rota').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  return { 
    shifts: shifts.filter(s => !s.isDeleted), 
    isLoading, 
    addShift: addShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync
  };
};
