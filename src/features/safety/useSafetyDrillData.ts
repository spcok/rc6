import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyDrillsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useQuery<SafetyDrill[]>({
    queryKey: ['safetyDrills'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('safety_drills').select('*');
        if (error) throw error;
        data.forEach(item => safetyDrillsCollection.update(item.id, () => item as SafetyDrill).catch(() => safetyDrillsCollection.insert(item as SafetyDrill)));
        return data as SafetyDrill[];
      } catch {
        console.warn("Network unreachable. Serving safety drills from local vault.");
        return await safetyDrillsCollection.getAll();
      }
    }
  });

  const addDrillLogMutation = useMutation({
    mutationFn: async (newDrill: Omit<SafetyDrill, 'id'>) => {
      const payload: SafetyDrill = { ...newDrill, id: crypto.randomUUID() } as SafetyDrill;
      try {
        const { error } = await supabase.from('safety_drills').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding safety drill locally.");
      }
      await safetyDrillsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safetyDrills'] })
  });

  const deleteDrillLogMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('safety_drills').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting safety drill locally.");
      }
      await safetyDrillsCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safetyDrills'] })
  });

  return {
    drills: drills.filter(d => !d.is_deleted),
    isLoading,
    addDrillLog: addDrillLogMutation.mutateAsync,
    deleteDrillLog: deleteDrillLogMutation.mutateAsync,
    isMutating: addDrillLogMutation.isPending || deleteDrillLogMutation.isPending
  };
};
