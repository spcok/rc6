import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { zlaDocumentsCollection } from '../../lib/database';
import { ZLADocument } from '../../types';

export const useZLADocsData = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useLiveQuery((q) => q.from({ documents: zlaDocumentsCollection }));

  const addDocumentMutation = useMutation({
    mutationFn: async (doc: Omit<ZLADocument, 'id'>) => {
      const payload = { ...doc, id: crypto.randomUUID() };
      return await zlaDocumentsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = documents.find(d => d.id === id);
      if (existing) {
        await zlaDocumentsCollection.update({ ...existing, is_deleted: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  return {
    documents: documents.filter(d => !d.is_deleted),
    isLoading,
    addDocument: addDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync
  };
};
