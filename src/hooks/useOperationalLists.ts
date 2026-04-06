import { useQuery, useMutation } from '@tanstack/react-query';
import { AnimalCategory, OperationalList } from '../types';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export function useOperationalLists(category: AnimalCategory = AnimalCategory.ALL) {
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['operational_lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_lists')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return data as OperationalList[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ type, value, itemCategory }: { type: 'food_type' | 'feed_method' | 'location' | 'event', value: string, itemCategory: AnimalCategory }) => {
      const { error } = await supabase.from('operational_lists').insert({
        id: crypto.randomUUID(),
        type,
        value,
        category: itemCategory,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operational_lists'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string, value: string }) => {
      const { error } = await supabase
        .from('operational_lists')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operational_lists'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('operational_lists')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operational_lists'] }),
  });

  const normalize = (str: string) => str.toLowerCase().replace(/s$/, '');

  const foodTypes = lists
    .filter(l => l.type === 'food_type' && (normalize(l.category) === normalize(category) || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const feedMethods = lists
    .filter(l => l.type === 'feed_method' && (normalize(l.category) === normalize(category) || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const eventTypes = lists
    .filter(l => l.type === 'event')
    .sort((a, b) => a.value.localeCompare(b.value));
  const locations = lists
    .filter(l => l.type === 'location')
    .sort((a, b) => a.value.localeCompare(b.value));

  return {
    foodTypes,
    feedMethods,
    eventTypes,
    locations,
    addListItem: (type: 'food_type' | 'feed_method' | 'location' | 'event', value: string, itemCategory: AnimalCategory = category) => addMutation.mutate({ type, value, itemCategory }),
    updateListItem: (id: string, value: string) => updateMutation.mutate({ id, value }),
    removeListItem: (id: string) => removeMutation.mutate(id),
    isLoading
  };
}
