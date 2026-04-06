import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';

const standardSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  notes: z.string().optional()
});

interface StandardFormProps {
  logType: LogType;
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  eventTypes?: string[];
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function StandardForm({ logType, animal, date, userInitials, existingLog, eventTypes, onSave, onCancel }: StandardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      value: existingLog?.value || '',
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = standardSchema.parse(value);
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animal_id: animal.id,
          log_type: logType,
          log_date: date,
          user_initials: userInitials,
          value: safePayload.value,
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

  const getLabel = () => {
    switch (logType) {
      case LogType.EVENT: return 'Event Type';
      case LogType.HEALTH: return 'Record Type';
      default: return 'Details';
    }
  };

  const getPlaceholder = () => {
    switch (logType) {
      case LogType.MISTING: return 'e.g. Heavy mist';
      case LogType.WATER: return 'e.g. Water changed';
      case LogType.HEALTH: return 'e.g. Checkup';
      default: return 'e.g. General log entry';
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      <form.Field name="value" children={(field) => (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{getLabel()}</label>
          {logType === LogType.EVENT && eventTypes ? (
            <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required>
              <option value="">Select Event</option>
              {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          ) : (
            <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} placeholder={getPlaceholder()} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required />
          )}
        </div>
      )} />

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
