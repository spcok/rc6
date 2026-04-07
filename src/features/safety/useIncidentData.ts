import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('incidents').select('*').limit(2500);
        if (error) throw error;
        // Anti-corruption fix: using single draft update for RC6 database.ts compatibility
        for (const item of data) {
           await incidentsCollection.update(item as Incident & { id: string }).catch(() => incidentsCollection.insert(item as Incident));
        }
        return data as Incident[];
      } catch {
        console.warn("Network unreachable. Serving incidents from local vault.");
        return await incidentsCollection.getAll();
      }
    }
  });

  const addIncidentMutation = useMutation({
    onMutate: async (incident: Omit<Incident, 'id' | 'created_at'>) => {
      const payload: Incident = {
        ...incident,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      } as Incident;
      await incidentsCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at'>, variables, context) => {
      const payload = (context as any)?.payload || {
        ...incident,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('incidents').insert([payload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  const deleteIncidentMutation = useMutation({
    onMutate: async (id: string) => {
      const existing = incidents.find(i => i.id === id);
      if (existing) {
        const draft = { ...existing, is_deleted: true } as Incident;
        await incidentsCollection.update(draft as Incident & { id: string });
      }
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  return {
    incidents: incidents.filter(i => !i.is_deleted),
    isLoading,
    addIncident: addIncidentMutation.mutateAsync,
    deleteIncident: deleteIncidentMutation.mutateAsync,
    isMutating: addIncidentMutation.isPending || deleteIncidentMutation.isPending
  };
};
