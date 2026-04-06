import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';
import { convertToGrams, convertFromGrams } from '../../../services/weightUtils';

const weightSchema = z.object({
  weightGrams: z.number().positive("Weight must be greater than 0"),
  weightValues: z.object({
    g: z.number(),
    lb: z.number(),
    oz: z.number(),
    eighths: z.number()
  }),
  notes: z.string().optional()
});

interface WeightFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function WeightForm({ animal, date, userInitials, existingLog, onSave, onCancel }: WeightFormProps) {
  const targetUnit = animal?.weightUnit === 'lbs_oz' ? 'lb' : (animal?.weightUnit === 'oz' ? 'oz' : 'g');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      weightGrams: existingLog?.weightGrams || 0,
      weightValues: existingLog?.weightGrams ? convertFromGrams(existingLog.weightGrams, targetUnit as 'g' | 'oz' | 'lb') : { g: 0, lb: 0, oz: 0, eighths: 0 },
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = weightSchema.parse(value);
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animalId: animal.id,
          logType: LogType.WEIGHT,
          logDate: date,
          userInitials: userInitials,
          weightGrams: safePayload.weightGrams,
          weight: safePayload.weightGrams,
          weightUnit: animal.weightUnit,
          value: `${safePayload.weightGrams}g`,
          notes: safePayload.notes
        };
        await onSave(payload);
        onCancel();
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
      <form.Field name="weightValues" children={(field) => {
        const handleWeightChange = (subField: string, val: string) => {
          const num = val === '' ? 0 : parseInt(val, 10);
          const newValues = { ...field.state.value, [subField]: num };
          field.handleChange(newValues);
          const totalGrams = convertToGrams(targetUnit as 'g' | 'oz' | 'lb', newValues);
          form.setFieldValue('weightGrams', totalGrams);
        };

        return (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Current Weight ({targetUnit})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {targetUnit === 'g' && (
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Grams</label>
                  <input type="number" value={field.state.value.g || ''} onChange={(e) => handleWeightChange('g', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. 1050" />
                </div>
              )}
              {targetUnit === 'oz' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ounces (oz)</label>
                    <input type="number" value={field.state.value.oz || ''} onChange={(e) => handleWeightChange('oz', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" placeholder="oz" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">8ths</label>
                    <select value={field.state.value.eighths || 0} onChange={(e) => handleWeightChange('eighths', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                      {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}/8</option>)}
                    </select>
                  </div>
                </>
              )}
              {targetUnit === 'lb' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pounds (lb)</label>
                    <input type="number" value={field.state.value.lb || ''} onChange={(e) => handleWeightChange('lb', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" placeholder="lb" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ounces (oz)</label>
                    <select value={field.state.value.oz || 0} onChange={(e) => handleWeightChange('oz', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                      {Array.from({length: 16}, (_, i) => i).map(n => <option key={n} value={n}>{n} oz</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">8ths</label>
                    <select value={field.state.value.eighths || 0} onChange={(e) => handleWeightChange('eighths', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                      {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}/8</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 italic mt-2">Calculated Value: {convertToGrams(targetUnit as 'g' | 'oz' | 'lb', field.state.value).toFixed(2)}g</p>
          </div>
        );
      }} />
      
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
