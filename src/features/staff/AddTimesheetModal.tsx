import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { TimesheetStatus } from '@/src/types';
import { useTimesheetData } from './useTimesheetData';

const schema = z.object({
  staff_name: z.string().min(1, 'Staff name is required'),
  date: z.string().min(1, 'Date is required'),
  clock_in: z.string().min(1, 'Clock in is required'),
  clock_out: z.string().optional(),
  total_hours: z.number().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(TimesheetStatus),
});

interface Props {
  onClose: () => void;
}

export default function AddTimesheetModal({ onClose }: Props) {
  const { addTimesheet } = useTimesheetData();
  
  const form = useForm({
    defaultValues: {
      staff_name: '',
      date: new Date().toISOString().split('T')[0],
      clock_in: '',
      clock_out: '',
      total_hours: 0,
      notes: '',
      status: TimesheetStatus.ACTIVE
    },
    onSubmit: async ({ value }) => {
      const data = schema.parse(value);
      await addTimesheet({
        ...data,
        status: data.status as TimesheetStatus
      });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6">Record Timesheet</h2>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="staff_name" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Name</label>
              <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              {field.state.meta.errors ? <p className="text-rose-500 text-[10px]">{field.state.meta.errors.join(', ')}</p> : null}
            </div>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="date" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            )} />
            <form.Field name="status" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as TimesheetStatus)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold">
                  {Object.values(TimesheetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="clock_in" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clock In</label>
                <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            )} />
            <form.Field name="clock_out" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clock Out</label>
                <input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold" />
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
