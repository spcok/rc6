import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer, TransferType, TransferStatus } from '../../types';

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
        const { data, error } = await supabase.from('transfers').select('*').limit(2500); // Phase 1 Fix
        if (error) throw error;
        
        // Anti-Corruption Layer: Map to camelCase
        const mappedTransfers: Transfer[] = (data as unknown as SupabaseTransfer[]).map((item: SupabaseTransfer) => ({
          id: item.id,
          animalId: item.animal_id || '',
          animalName: item.animal_name || 'Unknown',
          transferType: (item.transfer_type as TransferType) || TransferType.ARRIVAL,
          date: item.date || new Date().toISOString(),
          institution: item.institution || 'Unknown',
          transportMethod: item.transport_method || 'Unknown',
          citesArticle10Ref: item.cites_article_10_ref || 'N/A',
          status: (item.status as TransferStatus) || TransferStatus.PENDING,
          isDeleted: item.is_deleted
        }));
        
        for (const item of mappedTransfers) {
          // Phase 1 Fix: Single draft update
          await transfersCollection.update(item).catch(() => transfersCollection.insert(item));
        }
        return mappedTransfers;
      } catch {
        console.warn("Network unreachable. Serving transfers from local vault.");
        return await transfersCollection.getAll();
      }
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload: Transfer = { ...transfer, id: crypto.randomUUID(), isDeleted: false } as Transfer;
      
      // Payload Integrity: Map to snake_case
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        animal_name: payload.animalName,
        transfer_type: payload.transferType,
        date: payload.date,
        institution: payload.institution,
        transport_method: payload.transportMethod,
        cites_article_10_ref: payload.citesArticle10Ref,
        status: payload.status,
        is_deleted: payload.isDeleted
      };

      try {
        const { error } = await supabase.from('transfers').insert([supabasePayload]);
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
      // Payload Integrity: Map to snake_case
      const supabasePayload = {
        animal_id: transfer.animalId,
        animal_name: transfer.animalName,
        transfer_type: transfer.transferType,
        date: transfer.date,
        institution: transfer.institution,
        transport_method: transfer.transportMethod,
        cites_article_10_ref: transfer.citesArticle10Ref,
        status: transfer.status,
        is_deleted: transfer.isDeleted
      };

      try {
        const { error } = await supabase.from('transfers').update(supabasePayload).eq('id', transfer.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating transfer locally.");
      }
      await transfersCollection.update(transfer); // Phase 1 Fix
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = transfers.find(t => t.id === id);
      if (!existing) return;
      const draft = { ...existing, isDeleted: true };

      try {
        const { error } = await supabase.from('transfers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting transfer locally.");
      }
      await transfersCollection.update(draft); // Phase 1 Fix
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers: transfers.filter(t => !t.isDeleted), // Anti-Corruption Layer Fix
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};