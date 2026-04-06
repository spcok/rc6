import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer, TransferType, TransferStatus } from '../../types';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

interface SupabaseTransfer {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  transfer_type: string | null;
  date: string | null;
  institution: string | null;
  transport_method: string | null;
  cites_article_10_ref: string | null;
  status: string | null;
  is_deleted: boolean;
}

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transfers').select('*');
        if (error) throw error;
        const transfers: Transfer[] = (data as unknown as SupabaseTransfer[]).map((item: SupabaseTransfer) => ({
          id: item.id,
          animalId: item.animal_id,
          animalName: item.animal_name || 'Unknown',
          transferType: (item.transfer_type as TransferType) || TransferType.ARRIVAL,
          date: item.date || new Date().toISOString(),
          institution: item.institution || 'Unknown',
          transportMethod: item.transport_method || 'Unknown',
          citesArticle10Ref: item.cites_article_10_ref || 'N/A',
          status: (item.status as TransferStatus) || TransferStatus.PENDING,
          isDeleted: item.is_deleted
        }));
        
        for (const item of transfers) {
          try {
            await transfersCollection.update(sanitizePayload(item));
          } catch {
            await transfersCollection.insert(sanitizePayload(item));
          }
        }
        return transfers;
      } catch {
        console.warn("Network unreachable. Serving transfers from local vault.");
        return await transfersCollection.getAll();
      }
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload: Transfer = sanitizePayload({ ...transfer, id: crypto.randomUUID() } as Transfer);
      try {
        const { error } = await supabase.from('transfers').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding transfer locally.");
      }
      await transfersCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      try {
        const { error } = await supabase.from('transfers').update(transfer).eq('id', transfer.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating transfer locally.");
      }
      await transfersCollection.update(sanitizePayload(transfer));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('transfers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting transfer locally.");
      }
      const existing = transfers.find(t => t.id === id);
      if (existing) {
        await transfersCollection.update(sanitizePayload({ ...existing, isDeleted: true }));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers: transfers.filter(t => !t.is_deleted),
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};
