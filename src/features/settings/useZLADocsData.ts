import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ZLADocument } from '../../types';
import { zlaDocumentsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useZLADocsData = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<ZLADocument[]>({
    queryKey: ['zla_documents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('zla_documents').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: ZLADocument[] = data.map((item: Record<string, unknown>) => mapToCamelCase<ZLADocument>(item));
        
        for (const item of mappedData) {
          try {
            await zlaDocumentsCollection.update(item);
          } catch {
            await zlaDocumentsCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving ZLA docs from local vault.");
        return await zlaDocumentsCollection.getAll();
      }
    }
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (doc: Omit<ZLADocument, 'id'>) => {
      const payload = { ...doc, id: crypto.randomUUID(), isDeleted: false } as ZLADocument;
      
      const supabasePayload = {
        ...payload,
        is_deleted: payload.isDeleted,
      };
      delete (supabasePayload as any).isDeleted;

      try {
        const { error } = await supabase.from('zla_documents').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding document locally.");
      }
      await zlaDocumentsCollection.insert(payload);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = documents.find(d => d.id === id);
      if (existing) {
        const updated = { ...existing, isDeleted: true } as ZLADocument;
        try {
          const { error } = await supabase.from('zla_documents').update({ is_deleted: true }).eq('id', id);
          if (error) throw error;
        } catch {
          console.warn("Offline: Deleting document locally.");
        }
        await zlaDocumentsCollection.update(updated);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  return {
    documents: documents.filter(d => !d.isDeleted),
    isLoading,
    addDocument: addDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync
  };
};