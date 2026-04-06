import { useQuery } from '@tanstack/react-query';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType } from '../../types';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

interface SupabaseLogEntry {
  id: string;
  animal_id: string | null;
  log_type: string | null;
  log_date: string | null;
  value: string | null;
  notes: string | null;
  user_initials: string | null;
  weight_grams: number | null;
  weight: number | null;
  weight_unit: string | null;
  health_record_type: string | null;
  basking_temp_c: number | null;
  cool_temp_c: number | null;
  temperature_c: number | null;
  created_at: string;
  created_by: string | null;
  integrity_seal: string | null;
  updated_at: string;
  is_deleted: boolean;
}

export function useFeedingScheduleData(date: string) {
  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;
        
        const mappedData: LogEntry[] = (data as unknown as SupabaseLogEntry[]).map((item: SupabaseLogEntry) => ({
          id: item.id,
          animalId: item.animal_id,
          logType: item.log_type as LogType,
          logDate: item.log_date,
          value: item.value,
          notes: item.notes,
          userInitials: item.user_initials,
          weightGrams: item.weight_grams,
          weight: item.weight,
          weightUnit: item.weight_unit,
          healthRecordType: item.health_record_type,
          baskingTempC: item.basking_temp_c,
          coolTempC: item.cool_temp_c,
          temperatureC: item.temperature_c,
          createdAt: item.created_at,
          createdBy: item.created_by,
          integritySeal: item.integrity_seal,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted
        }));
        
        for (const item of mappedData) {
          try {
            await dailyLogsCollection.update(sanitizePayload(item));
          } catch {
            await dailyLogsCollection.insert(sanitizePayload(item));
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });

  const feedingLogs = logs.filter(l => l.logDate === date && l.logType === LogType.FEED);

  return {
    data: feedingLogs,
    isLoading
  };
}
