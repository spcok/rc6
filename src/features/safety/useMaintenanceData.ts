import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('maintenance').select('*');
        if (error) throw error;
        data.forEach(item => maintenanceCollection.update(item.id, () => item as MaintenanceLog).catch(() => maintenanceCollection.insert(item as MaintenanceLog)));
        return data as MaintenanceLog[];
      } catch {
        console.warn("Network unreachable. Serving maintenance logs from local vault.");
        return await maintenanceCollection.getAll();
      }
    }
  });

  const addLogMutation = useMutation({
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload: MaintenanceLog = { ...newTask, id: crypto.randomUUID() } as MaintenanceLog;
      try {
        const { error } = await supabase.from('maintenance').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding maintenance log locally.");
      }
      await maintenanceCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const updateLogMutation = useMutation({
    mutationFn: async (task: MaintenanceLog) => {
      try {
        const { error } = await supabase.from('maintenance').update(task).eq('id', task.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating maintenance log locally.");
      }
      await maintenanceCollection.update(task.id, (prev) => ({ ...prev, ...task }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('maintenance').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting maintenance log locally.");
      }
      await maintenanceCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    isMutating: addLogMutation.isPending || updateLogMutation.isPending || deleteLogMutation.isPending
  };
};
