import { createCollection as baseCreateCollection } from '@tanstack/react-db';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { LogEntry, Animal, Timesheet } from '../types';

export interface TanStackCollection<T> {
  insert: (item: T) => Promise<void>;
  update: (draft: Partial<T> & { id: string }) => Promise<void>; // ARCHITECTURAL FIX: Single draft object API
  delete: (id: string) => Promise<void>;
  getAll: () => Promise<T[]>;
}

// --- COLLECTION FACTORY ---
export const createStandardCollection = <T extends { id: string }>(tableName: string): TanStackCollection<T> => {
  const collection = baseCreateCollection<T, string>({
    queryKey: [tableName],
    queryClient,
    getKey: (item: T) => item.id,
    queryFn: async () => {
      // ARCHITECTURAL FIX: 5000 row limit to prevent memory exhaustion on massive offline syncs
      const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false).limit(5000);
      if (error) throw error;
      return (data as T[]) || [];
    },
    onInsert: async (item: T) => {
      const { error } = await supabase.from(tableName).upsert([item]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    onUpdate: async (id: string, draft: Partial<T>) => {
      const { error } = await supabase.from(tableName).update(draft).eq('id', id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    sync: { enabled: true }
  });

  // ARCHITECTURAL FIX: Strict single-draft update adapter.
  // We expose a clean single-draft API to the frontend hooks, mapping it internally to TanStack's required structure.
  const singleDraftUpdate = async (draft: Partial<T> & { id: string }) => {
    await collection.update(draft);
  };

  return {
    insert: collection.insert,
    update: singleDraftUpdate,
    delete: collection.delete,
    getAll: collection.queryFn
  };
};

// 1. Animals Collection
export const animalsCollection = createStandardCollection<Animal>('animals');

// 2. Daily Logs Collection
export const dailyLogsCollection = (() => {
  const collection = baseCreateCollection<LogEntry, string>({
    queryKey: ['daily_logs'],
    queryClient,
    getKey: (item: LogEntry) => item.id!,
    queryFn: async () => {
      // ARCHITECTURAL FIX: Removed 14-day limit to ensure offline logs persist. Capped at 5000 rows.
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('is_deleted', false)
        .limit(5000); 
      if (error) throw error;
      return (data as LogEntry[]) || [];
    },
    onInsert: async (item: LogEntry) => {
      const { error } = await supabase.from('daily_logs').upsert([item]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    onUpdate: async (id: string, draft: Partial<LogEntry>) => {
      const { error } = await supabase.from('daily_logs').update(draft).eq('id', id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    sync: { enabled: true }
  });

  const singleDraftUpdate = async (draft: Partial<LogEntry> & { id: string }) => {
    await collection.update(draft);
  };

  return {
    insert: collection.insert,
    update: singleDraftUpdate,
    delete: collection.delete,
    getAll: collection.queryFn
  };
})();

// 3. Tasks Collection
export const tasksCollection = createStandardCollection<{ id: string; title: string; dueDate: string; completed: boolean; type: string; animalId: string; notes: string; }>('tasks');

// --- SETTINGS & USERS MODULES ---
export const usersCollection = createStandardCollection<{ id: string; name: string; email: string; role: string; }>('users');
export const orgSettingsCollection = createStandardCollection<{ id: string; key: string; value: string; }>('org_settings');
export const zlaDocumentsCollection = createStandardCollection<{ id: string; name: string; url: string; }>('zla_documents');
export const directoryCollection = createStandardCollection<{ id: string; name: string; category: string; }>('directory');

// --- MEDICAL & LOGISTICS MODULES ---
export const medicalLogsCollection = createStandardCollection<{ id: string; animalId: string; logType: string; logDate: string; value: string; }>('medical_logs');
export const marChartsCollection = createStandardCollection<{ id: string; animalId: string; noteType: string; }>('mar_charts');
export const quarantineRecordsCollection = createStandardCollection<{ id: string; animalId: string; startDate: string; }>('quarantine_records');
export const movementsCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('movements');
export const transfersCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('transfers');

// --- STAFF MODULES ---
export const timesheetsCollection = createStandardCollection<Timesheet>('timesheets');
export const rotaCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('rota');
export const holidaysCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('holidays');

// --- SAFETY MODULES ---
export const safetyDrillsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('safety_drills');
export const incidentsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('incidents');
export const maintenanceCollection = createStandardCollection<{ id: string; title: string; date: string; }>('maintenance');
export const firstAidCollection = createStandardCollection<{ id: string; title: string; date: string; }>('first_aid');