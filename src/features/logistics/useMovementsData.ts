import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { InternalMovement, MovementType } from '../../types';

interface SupabaseMovement {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  log_date: string | null;
  movement_type: string | null;
  source_location: string | null;
  destination_location: string | null;
  created_by: string | null;
  created_at: string;
  is_deleted: boolean;
}

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery<InternalMovement[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('movements').select('*');
        if (error) throw error;
        const movements: InternalMovement[] = (data as unknown as SupabaseMovement[]).map((item: SupabaseMovement) => ({
          id: item.id,
          animalId: item.animal_id || '',
          animalName: item.animal_name || 'Unknown',
          logDate: item.log_date || new Date().toISOString(),
          movementType: (item.movement_type as MovementType) || MovementType.TRANSFER,
          sourceLocation: item.source_location || '',
          destinationLocation: item.destination_location || '',
          createdBy: item.created_by || 'Unknown',
          createdAt: item.created_at || '',
          isDeleted: item.is_deleted || false
        }));
        
        for (const item of movements) {
          try {
            await movementsCollection.update(item.id, () => item);
          } catch {
            await movementsCollection.insert(item);
          }
        }
        return movements;
      } catch {
        console.warn("Network unreachable. Serving movements from local vault.");
        return await movementsCollection.getAll();
      }
    }
  });

  const addMovementMutation = useMutation({
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const payload: InternalMovement = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as InternalMovement;
      try {
        const { error } = await supabase.from('movements').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding movement locally.");
      }
      await movementsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movements'] })
  });

  return { 
    movements: movements.filter(m => !m.isDeleted), 
    isLoading, 
    addMovement: addMovementMutation.mutateAsync,
    isMutating: addMovementMutation.isPending
  };
};
