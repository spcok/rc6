import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Animal, MARChart } from '../../types';

const schema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required'),
  staffInitials: z.string().min(2, 'Initials are required'),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chart: Omit<MARChart, 'id' | 'animalName' | 'administeredDates' | 'status'>) => Promise<void>;
  animals: Animal[];
}

export const AddMarChartModal: React.FC<Props> = ({ isOpen, onClose, onSave, animals }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      animalId: '',
      medication: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      instructions: '',
      staffInitials: ''
    },
    onSubmit: async ({ value }) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const data = schema.parse(value);
        await onSave(data);
        form.reset();
        onClose();
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-slate-900">Add Medication Chart</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="animalId" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Animal</label>
              <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2">
                <option value="">Select an animal</option>
                {animals?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )} />
          <form.Field name="medication" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Medication Name</label>
              <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <form.Field name="dosage" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Dosage</label>
              <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <form.Field name="frequency" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Frequency</label>
              <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <form.Field name="instructions" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Instructions</label>
              <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <form.Field name="staffInitials" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Staff Initials <span className="text-red-500">*</span></label>
              <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" required />
            </div>
          )} />
          <form.Field name="startDate" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <form.Field name="endDate" children={(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-700">End Date (Optional)</label>
              <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            </div>
          )} />
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:bg-slate-400">
            {isSubmitting ? 'Saving...' : 'Save Chart'}
          </button>
        </form>
      </div>
    </div>
  );
};
