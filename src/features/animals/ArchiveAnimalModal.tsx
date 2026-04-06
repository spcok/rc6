import React, { useState } from 'react';
import { Animal } from '@/src/types';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal;
}

interface ArchivePayload {
  archived: boolean;
  archive_reason: string;
  archived_at: string;
  archive_type: string;
  disposition_status: string;
  disposition_date: string;
  date_of_death?: string;
}

const archiveSchema = z.object({
  archiveType: z.string().min(1, 'Archive type is required'),
  destination: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  vet: z.string().optional(),
  justification: z.string().optional(),
  cause: z.string().optional(),
  necropsy: z.string().optional(),
});

export const ArchiveAnimalModal: React.FC<Props> = ({ isOpen, onClose, animal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      archiveType: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      vet: '',
      justification: '',
      cause: '',
      necropsy: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = archiveSchema.parse(value);
        const reason = Object.entries(safePayload)
          .filter(([k, v]) => k !== 'archiveType' && k !== 'date' && v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        
        const archiveDate = safePayload.date || new Date().toISOString();
        
        const updatePayload: ArchivePayload = {
          archived: true,
          archive_reason: reason,
          archived_at: new Date().toISOString(),
          archive_type: safePayload.archiveType,
          disposition_status: safePayload.archiveType,
          disposition_date: archiveDate
        };

        if (safePayload.archiveType === 'Death' || safePayload.archiveType === 'Euthanasia') {
          updatePayload.date_of_death = archiveDate;
        }

        const { error } = await supabase
          .from('animals')
          .update(updatePayload)
          .eq('id', animal.id);

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ['animals'] });
        navigate({ to: '/animals' });
        onClose();
      } catch (err: unknown) {
        console.error('Archive error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        window.alert(`Failed to archive animal: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Archive {animal.name}</h2>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
          <form.Field name="archiveType" children={(field) => (
            <select className="w-full mb-4 p-2 border rounded" onChange={(e) => field.handleChange(e.target.value)} value={field.state.value}>
              <option value="">Select Archive Type</option>
              <option value="Disposition">Disposition</option>
              <option value="Death">Death</option>
              <option value="Euthanasia">Euthanasia</option>
              <option value="Missing">Missing</option>
              <option value="Stolen">Stolen</option>
            </select>
          )} />
          
          <form.Subscribe selector={(state) => state.values.archiveType} children={(archiveType) => (
            <div className="flex flex-col gap-2 mb-4">
              {archiveType === 'Disposition' && (
                <>
                  <form.Field name="destination" children={(field) => <input className="w-full p-2 border rounded" placeholder="Destination Institution" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="date" children={(field) => <input className="w-full p-2 border rounded" type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="notes" children={(field) => <textarea className="w-full p-2 border rounded" placeholder="Notes" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                </>
              )}
              {archiveType === 'Euthanasia' && (
                <>
                  <form.Field name="vet" children={(field) => <input className="w-full p-2 border rounded" placeholder="Authorizing Vet" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="justification" children={(field) => <input className="w-full p-2 border rounded" placeholder="Medical Justification" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="date" children={(field) => <input className="w-full p-2 border rounded" type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                </>
              )}
              {archiveType === 'Death' && (
                <>
                  <form.Field name="cause" children={(field) => <input className="w-full p-2 border rounded" placeholder="Suspected Cause" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="necropsy" children={(field) => (
                    <select className="w-full p-2 border rounded" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
                      <option value="">Necropsy Required?</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  )} />
                  <form.Field name="date" children={(field) => <input className="w-full p-2 border rounded" type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                </>
              )}
              {(archiveType === 'Missing' || archiveType === 'Stolen') && (
                <>
                  <form.Field name="date" children={(field) => <input className="w-full p-2 border rounded" type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                  <form.Field name="notes" children={(field) => <textarea className="w-full p-2 border rounded" placeholder="Notes" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />} />
                </>
              )}
            </div>
          )} />
          
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded" disabled={isSubmitting}>Cancel</button>
            <form.Subscribe selector={(state) => state.values.archiveType} children={(archiveType) => (
              <button type="submit" disabled={!archiveType || isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">
                {isSubmitting ? 'Archiving...' : 'Submit'}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
};
