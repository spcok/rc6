import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, AnimalCategory, LogType, LogEntry } from '../../../types';
import { getMaidstoneDailyWeather } from '../../../services/weatherService';


interface Props {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  defaultTemperature?: number;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function TemperatureForm({ animal, date, userInitials, existingLog, defaultTemperature, onSave, onCancel }: Props) {
  const isExotic = animal.category === AnimalCategory.EXOTICS;
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      temperature: existingLog?.temperatureC ?? defaultTemperature ?? undefined,
      baskingTemp: existingLog?.baskingTempC ?? undefined,
      coolTemp: existingLog?.coolTempC ?? undefined,
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setIsSubmitting(true);
      try {
        if (isExotic && (value.baskingTemp === undefined || value.coolTemp === undefined)) {
          throw new Error('Both Basking and Cool temperatures are required for exotics.');
        } else if (!isExotic && value.temperature === undefined) {
          throw new Error('Temperature is required.');
        }

        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animalId: animal.id,
          logType: LogType.TEMPERATURE,
          logDate: date,
          userInitials: userInitials,
        };

        if (isExotic) {
          payload.baskingTempC = value.baskingTemp;
          payload.coolTempC = value.coolTemp;
          payload.value = `${value.baskingTemp}°C | ${value.coolTemp}°C`;
          payload.notes = JSON.stringify({ basking: value.baskingTemp, cool: value.coolTemp });
        } else {
          payload.temperatureC = value.temperature;
          payload.value = `${value.temperature}°C`;
          payload.notes = value.notes;
        }

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

  const handleFetchWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const weather = await getMaidstoneDailyWeather();
      form.setFieldValue('temperature', Math.round(weather.currentTemp));
      form.setFieldValue('notes', form.state.values.notes ? `${form.state.values.notes} | ${weather.description}` : weather.description);
    } catch (err) {
      console.error(err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>}
      
      {isExotic ? (
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="baskingTemp" children={(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Basking Temp (°C)</label>
              <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold" required />
            </div>
          )} />
          <form.Field name="coolTemp" children={(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cool Temp (°C)</label>
              <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold" required />
            </div>
          )} />
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-2">
            <form.Field name="temperature" children={(field) => (
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Temperature (°C)</label>
                <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold" required disabled={isWeatherLoading} />
              </div>
            )} />
            <button type="button" onClick={handleFetchWeather} disabled={isWeatherLoading} className="px-4 py-3 bg-sky-50 text-sky-700 border-2 border-sky-200 rounded-xl font-bold text-xs uppercase hover:bg-sky-100 flex items-center gap-2 transition-colors disabled:opacity-50">
              {isWeatherLoading ? <Loader2 size={14} className="animate-spin" /> : '☁️ Fetch 13:00'}
            </button>
          </div>
        </div>
      )}

      {!isExotic && (
        <form.Field name="notes" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes</label>
            <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-xs min-h-[100px] resize-none" />
          </div>
        )} />
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-white border-2 text-slate-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>
    </form>
  );
}
