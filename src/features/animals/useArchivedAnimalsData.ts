import { useQuery } from '@tanstack/react-query';
import { animalsCollection } from '../../lib/database';

export function useArchivedAnimalsData() {
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      return await animalsCollection.getAll();
    }
  });
  
  const archivedAnimals = animals.filter(a => a.isDeleted);

  return { archivedAnimals, isLoading, error: null };
}
