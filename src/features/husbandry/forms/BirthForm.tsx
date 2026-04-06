import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';
import { animalsCollection } from '../../../lib/database';

const birthSchema = z.object({
  litterSize: z.number().min(0, 'Litter size must be at least 0'),
  litterHealth: z.string().min(1, 'Health status is required'),
  notes: z.string().optional(),
  pups: z.array(z.object({ id: z.string(), name: z.string() }))
});

interface BirthFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function BirthForm({ animal, date, userInitials, existingLog, onSave, onCancel }: BirthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      litterSize: 0,
      litterHealth: 'Healthy',
      notes: existingLog?.notes || '',
      pups: [] as { id: string; name: string }[]
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = birthSchema.parse(value);
        
        if (!existingLog) {
          for (const pup of safePayload.pups) {
            await animalsCollection.insert({
              id: pup.id,
              name: pup.name,
              species: animal.species,
              category: animal.category,
              dob: date,
              is_dob_unknown: false,
              sex: 'Unknown',
              location: animal.location,
              acquisition_date: date,
              acquisition_type: 'BORN',
              origin: 'Captive Bred',
              dam_id: animal.sex === 'Female' ? animal.id : undefined,
              sire_id: animal.sex === 'Male' ? animal.id : undefined,
              parent_mob_id: animal.entity_type === 'GROUP' ? animal.id : animal.parent_mob_id,
              archived: false,
              is_quarantine: false,
              display_order: 0,
              is_deleted: false
            });
          }
        }

        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animal_id: animal.id,
          log_type: LogType.BIRTH,
          log_date: date,
          user_initials: userInitials,
          value: `Litter Size: ${safePayload.litterSize} (${safePayload.litterHealth})`,
          notes: safePayload.notes
        };
        await onSave(payload);
        onCancel(); // Force modal to close on success
      } catch (err: unknown) {
        console.error("Submission Error:", err);
        if (err instanceof Error) {
          alert(`Database Error: ${err.message}`);
        } else {
          alert('Failed to save log');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="litterSize" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Litter Size</label>
            <input type="number" value={field.state.value} onChange={e => field.handleChange(parseInt(e.target.value) || 0)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required />
          </div>
        )} />
        <form.Field name="litterHealth" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Health Status</label>
            <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required>
              <option value="Healthy">Healthy</option>
              <option value="Complications">Complications</option>
              <option value="Stillborn">Stillborn</option>
            </select>
          </div>
        )} />
      </div>

      {!existingLog && (
        <form.Field name="pups" children={(field) => (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Pups ({field.state.value.length})</label>
              <button type="button" onClick={() => field.handleChange([...field.state.value, { id: uuidv4(), name: `Pup ${field.state.value.length + 1}` }])} className="text-emerald-600 font-bold text-xs flex items-center gap-1"><Plus size={14} /> Add Pup</button>
            </div>
            {field.state.value.map((pup, index) => (
              <div key={pup.id} className="flex gap-2">
                <input type="text" value={pup.name} onChange={e => {
                  const newPups = [...field.state.value];
                  newPups[index].name = e.target.value;
                  field.handleChange(newPups);
                }} className="flex-1 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
                <button type="button" onClick={() => field.handleChange(field.state.value.filter(p => p.id !== pup.id))} className="p-3 text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )} />
      )}

      <form.Field name="notes" children={(field) => (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
          <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
        </div>
      )} />
      
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-white border-2 text-slate-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>
    </form>
  );
}
