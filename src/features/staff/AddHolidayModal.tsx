import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { LeaveType, HolidayStatus } from '@/src/types';
import { useHolidayData } from './useHolidayData';

const schema = z.object({
  staff_name: z.string().min(1, 'Staff name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  leave_type: z.nativeEnum(LeaveType),
  status: z.nativeEnum(HolidayStatus),
  notes: z.string().optional(),
});

interface Props {
  onClose: () => void;
}

export default function AddHolidayModal({ onClose }: Props) {
  const { addHoliday } = useHolidayData();
  
  const form = useForm({
    defaultValues: {
      staff_name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      leave_type: LeaveType.ANNUAL,
      status: HolidayStatus.PENDING,
      notes: ''
    },
    onSubmit: async ({ value }) => {
      const data = schema.parse(value);
      await addHoliday(data);
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6">Request Leave</h2>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="staff_name" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Name</label>
              <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              {field.state.meta.errors ? <p className="text-rose-500 text-[10px]">{field.state.meta.errors.join(', ')}</p> : null}
            </div>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="start_date" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</label>
                <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            )} />
            <form.Field name="end_date" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</label>
                <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="leave_type" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Type</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as LeaveType)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold">
                  {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )} />
            <form.Field name="status" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as HolidayStatus)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold">
                  {Object.values(HolidayStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )} />
          </div>

          <form.Field name="notes" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
              <textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold h-24" />
            </div>
          )} />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Commit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
