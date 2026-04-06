import { useQuery } from '@tanstack/react-query';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export function useAnimalProfileData(animalId: string | undefined) {
  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: animalsCollection.getAll,
  });
  
  const animal = animals.find(a => a.id === animalId);

  return { animal, isLoading };
}
