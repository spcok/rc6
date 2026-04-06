import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { ShiftType, Shift } from '../../types';
import { useRotaData } from './useRotaData';
import { useUsersData } from '../settings/useUsersData';

const schema = z.object({
  user_id: z.string().min(1, 'User is required'),
  date: z.string().min(1, 'Date is required'),
  shift_type: z.nativeEnum(ShiftType),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  assigned_area: z.string().optional(),
  repeat: z.boolean(),
  repeatDays: z.array(z.number()),
  weeks: z.number().min(1).max(52)
});

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, onClose }) => {
  const { addShift } = useRotaData();
  const { users } = useUsersData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      user_id: '',
      date: new Date().toISOString().split('T')[0],
      shift_type: ShiftType.DAY,
      start_time: '',
      end_time: '',
      assigned_area: '',
      repeat: false,
      repeatDays: [] as number[],
      weeks: 1
    },
    onSubmit: async ({ value }) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const data = schema.parse(value);
        const user = users.find(u => u.id === data.user_id);
        
        const cleanShiftData = {
          user_id: data.user_id,
          date: data.date,
          shift_type: data.shift_type,
          start_time: data.start_time,
          end_time: data.end_time,
          assigned_area: data.assigned_area,
          user_name: user?.name || 'Unknown',
          user_role: user?.role || 'Unknown'
        };

        await addShift(cleanShiftData as Shift);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Add Shift</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="user_id" children={(field) => (
            <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Select User</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )} />
          <form.Field name="date" children={(field) => (
            <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border p-2 rounded" />
          )} />
          <form.Field name="shift_type" children={(field) => (
            <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as ShiftType)} className="w-full border p-2 rounded">
              {Object.values(ShiftType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )} />
          <div className="flex gap-2">
            <form.Field name="start_time" children={(field) => (
              <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border p-2 rounded" />
            )} />
            <form.Field name="end_time" children={(field) => (
              <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border p-2 rounded" />
            )} />
          </div>
          <form.Field name="assigned_area" children={(field) => (
            <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Assigned Area" className="w-full border p-2 rounded" />
          )} />
          
          <form.Field name="repeat" children={(field) => (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={field.state.value} onChange={e => field.handleChange(e.target.checked)} />
              Repeat Shift?
            </label>
          )} />

          <form.Subscribe selector={(state) => state.values.repeat} children={(repeat) => (
            repeat && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <form.Field name="repeatDays" children={(field) => (
                    <>
                      {[
                        { label: 'M', val: 1 }, { label: 'T', val: 2 }, { label: 'W', val: 3 }, 
                        { label: 'T', val: 4 }, { label: 'F', val: 5 }, { label: 'S', val: 6 }, { label: 'S', val: 0 }
                      ].map((day) => (
                        <button 
                          key={day.val} 
                          type="button" 
                          onClick={() => {
                            const current = field.state.value;
                            field.handleChange(
                              current.includes(day.val)
                                ? current.filter(d => d !== day.val)
                                : [...current, day.val]
                            );
                          }}
                          className={`flex-1 py-2 rounded font-bold text-xs transition-colors ${field.state.value.includes(day.val) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </>
                  )} />
                </div>
                <form.Field name="weeks" children={(field) => (
                  <input type="number" value={field.state.value} onChange={e => field.handleChange(Number(e.target.value))} placeholder="Duration (Weeks)" className="w-full border p-2 rounded" />
                )} />
              </div>
            )
          )} />

          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white p-2 rounded flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Shift'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddShiftModal;
