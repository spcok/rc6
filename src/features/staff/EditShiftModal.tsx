import React, { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { X, Save, AlertTriangle } from 'lucide-react';
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
  updateMode: z.enum(['single', 'series']),
  repeatDays: z.array(z.number()),
  weeks: z.number().min(1).max(52)
});

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingShift: Shift | null;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, existingShift }) => {
  const { updateShift } = useRotaData();
  const { users } = useUsersData();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      user_id: existingShift?.user_id || '',
      date: existingShift?.date || new Date().toISOString().split('T')[0],
      shift_type: existingShift?.shift_type || ShiftType.DAY,
      start_time: existingShift?.start_time || '',
      end_time: existingShift?.end_time || '',
      assigned_area: existingShift?.assigned_area || '',
      updateMode: 'single' as 'single' | 'series',
      repeatDays: existingShift ? [new Date(existingShift.date).getDay()] : [],
      weeks: 4
    },
    onSubmit: async ({ value }) => {
      if (isSubmitting || !existingShift) return;
      setIsSubmitting(true);
      
      try {
        const data = schema.parse(value);
        const user = users.find(u => u.id === data.user_id);
        
        const cleanShiftData: Partial<Shift> = {
          id: existingShift.id,
          user_id: data.user_id,
          user_name: user?.name || existingShift.user_name,
          user_role: user?.role || existingShift.user_role,
          date: data.date,
          shift_type: data.shift_type,
          start_time: data.start_time,
          end_time: data.end_time,
          assigned_area: data.assigned_area,
        };

        await updateShift(cleanShiftData);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (existingShift) {
      form.reset({
        user_id: existingShift.user_id,
        date: existingShift.date,
        shift_type: existingShift.shift_type,
        start_time: existingShift.start_time,
        end_time: existingShift.end_time,
        assigned_area: existingShift.assigned_area || '',
        updateMode: 'single',
        repeatDays: [new Date(existingShift.date).getDay()],
        weeks: 4
      });
    }
  }, [existingShift, form]);

  if (!isOpen || !existingShift) return null;

  const daysOfWeek = [
    { label: 'M', val: 1 }, { label: 'T', val: 2 }, { label: 'W', val: 3 }, 
    { label: 'T', val: 4 }, { label: 'F', val: 5 }, { label: 'S', val: 6 }, { label: 'S', val: 0 }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Edit Shift</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="user_id" children={(field) => (
            <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium">
              <option value="">Select User</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )} />
          
          <form.Field name="date" children={(field) => (
            <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium" />
          )} />
          
          <form.Field name="shift_type" children={(field) => (
            <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as ShiftType)} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium">
              {Object.values(ShiftType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )} />
          
          <div className="flex gap-3">
            <form.Field name="start_time" children={(field) => (
              <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium" />
            )} />
            <form.Field name="end_time" children={(field) => (
              <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium" />
            )} />
          </div>
          
          <form.Field name="assigned_area" children={(field) => (
            <input type="text" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Assigned Area" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium" />
          )} />
          
          <div className="mt-6 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl space-y-4">
            <form.Field name="updateMode" children={(field) => (
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={field.state.value === 'single'} onChange={() => field.handleChange('single')} className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">Update this shift only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={field.state.value === 'series'} onChange={() => field.handleChange('series')} className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">Apply new pattern</span>
                </label>
              </div>
            )} />

            <form.Subscribe selector={(state) => state.values.updateMode} children={(updateMode) => (
              updateMode === 'series' && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <AlertTriangle size={14} /> Replaces future shifts in this series.
                  </p>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Repeat on days</label>
                    <form.Field name="repeatDays" children={(field) => (
                      <div className="flex gap-1">
                        {daysOfWeek.map((day) => (
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
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${field.state.value.includes(day.val) ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-emerald-500'}`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    )} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration (Weeks)</label>
                    <form.Field name="weeks" children={(field) => (
                      <input type="number" value={field.state.value} min="1" max="52" onChange={e => field.handleChange(Number(e.target.value))} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-emerald-500 outline-none transition-colors font-medium" />
                    )} />
                  </div>
                </div>
              )
            )} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditShiftModal;
