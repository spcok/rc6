import { useQuery } from '@tanstack/react-query';
import { Animal } from '../../types';
import { animalsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useIntelligenceData = () => {
  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: Animal[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Animal>(item));
        
        for (const item of mappedData) {
          try {
            await animalsCollection.update(item);
          } catch {
            await animalsCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving animals from local vault.");
        return await animalsCollection.getAll();
      }
    }
  });

  const runIUCNScan = async () => {
    if (!navigator.onLine) {
      console.log("IUCN Scan skipped: Network offline.");
      return null;
    }
    console.log("IUCN Scan Triggered");
    return true;
  };

  return {
    animals: animals.filter(a => !a.isDeleted),
    isLoading,
    runIUCNScan
  };
};
