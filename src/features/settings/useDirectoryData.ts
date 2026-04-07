import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contact } from '../../types';
import { directoryCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useDirectoryData = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['directory'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('directory').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: Contact[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Contact>(item));
        
        for (const item of mappedData) {
          try {
            await directoryCollection.update(item);
          } catch {
            await directoryCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving directory from local vault.");
        return await directoryCollection.getAll();
      }
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (contact: Omit<Contact, 'id'>) => {
      const payload = { ...contact, id: crypto.randomUUID(), isDeleted: false } as Contact;
      
      // Payload Integrity Mappings
      const supabasePayload = {
        ...payload,
        is_deleted: payload.isDeleted
      };
      delete (supabasePayload as any).isDeleted;

      try {
        const { error } = await supabase.from('directory').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding contact locally.");
      }
      await directoryCollection.insert(payload);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  const updateContactMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      const existing = contacts.find(c => c.id === contact.id);
      if (existing) {
        const updated = { ...existing, ...contact } as Contact;
        
        // Payload Integrity Mappings
        const supabasePayload = {
          ...updated,
          is_deleted: updated.isDeleted
        };
        delete (supabasePayload as any).isDeleted;

        try {
          const { error } = await supabase.from('directory').update(supabasePayload).eq('id', contact.id);
          if (error) throw error;
        } catch {
          console.warn("Offline: Updating contact locally.");
        }
        await directoryCollection.update(updated);
        return updated;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = contacts.find(c => c.id === id);
      if (existing) {
        const updated = { ...existing, isDeleted: true } as Contact;
        try {
          const { error } = await supabase.from('directory').update({ is_deleted: true }).eq('id', id);
          if (error) throw error;
        } catch {
          console.warn("Offline: Deleting contact locally.");
        }
        await directoryCollection.update(updated);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory'] })
  });

  return {
    contacts: contacts.filter(c => !c.isDeleted),
    isLoading,
    addContact: addContactMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync
  };
};