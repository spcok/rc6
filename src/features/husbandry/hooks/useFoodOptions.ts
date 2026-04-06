import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { OperationalList } from '../../../types';

export const useFoodOptions = () => {
  return useQuery({
    queryKey: ['food_options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_lists')
        .select('id, value')
        .eq('type', 'food_type')
        .eq('is_deleted', false);
      
      if (error) throw error;
      return (data || []) as OperationalList[];
    }
  });
};
