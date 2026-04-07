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
        const { data, error } = await supabase.from('maintenance').select('*').limit(2500); // Phase 1 Fix
        if (error) throw error;
        
        // Anti-Corruption Layer: Map to camelCase
        const mappedData: MaintenanceLog[] = data.map((item: any) => ({
          ...item,
          isDeleted: item.is_deleted,
          createdAt: item.created_at,
          // ensure we clean the snake_case variants if strict mapping is needed
          is_deleted: undefined,
          created_at: undefined
        }));

        for (const item of mappedData) {
            await maintenanceCollection.update(item).catch(() => maintenanceCollection.insert(item)); // Phase 1 Fix
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving maintenance logs from local vault.");
        return await maintenanceCollection.getAll();
      }
    }
  });

  const addLogMutation = useMutation({
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload: MaintenanceLog = { ...newTask, id: crypto.randomUUID(), isDeleted: false } as MaintenanceLog;
      
      // Payload Integrity
      const supabasePayload = {
        ...payload,
        is_deleted: payload.isDeleted,
        created_at: payload.createdAt || new Date().toISOString()
      };
      delete (supabasePayload as any).isDeleted;
      delete (supabasePayload as any).createdAt;

      try {
        const { error } = await supabase.from('maintenance').insert([supabasePayload]);
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
      // Payload Integrity
      const supabasePayload = {
        ...task,
        is_deleted: task.isDeleted,
        created_at: task.createdAt
      };
      delete (supabasePayload as any).isDeleted;
      delete (supabasePayload as any).createdAt;

      try {
        const { error } = await supabase.from('maintenance').update(supabasePayload).eq('id', task.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating maintenance log locally.");
      }
      await maintenanceCollection.update(task); // Phase 1 Fix
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = logs.find(l => l.id === id);
      if (!existing) return;
      const draft = { ...existing, isDeleted: true };

      try {
        const { error } = await supabase.from('maintenance').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting maintenance log locally.");
      }
      await maintenanceCollection.update(draft); // Phase 1 Fix
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  return {
    logs: logs.filter(l => !l.isDeleted), // Anti-Corruption Layer Fix
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    isMutating: addLogMutation.isPending || updateLogMutation.isPending || deleteLogMutation.isPending
  };
};