import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Timesheet } from '../../types';

const sanitizePayload = (payload: Record<string, unknown>) => {
  const clean = { ...payload };
  Object.keys(clean).forEach(key => {
    if (key.startsWith('$')) delete clean[key];
  });
  return clean;
};

export function useTimesheetData() {
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      try {
        // 1. ONLINE FIRST
        const { data, error } = await supabase.from('timesheets').select('*');
        if (error) throw error;
        
        // 2. REFRESH FAILOVER (Background)
        data.forEach(item => {
          const draft = item as Timesheet;
          // Architectural Rule 3: Strict draft object mutation
          timesheetsCollection.update(draft).catch(() => timesheetsCollection.insert(draft));
        });
        
        return data as Timesheet[];
      } catch {
        console.warn("Network unreachable. Falling back to 14-day local vault.");
        // 3. OFFLINE FAILOVER
        return await timesheetsCollection.getAll();
      }
    }
  });

  const clockInMutation = useMutation({
    mutationFn: async (staff_name: string) => {
      const newShift: Timesheet = {
        id: crypto.randomUUID(),
        staff_name,
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString(),
        status: 'Active' as const,
        is_deleted: false,
        created_at: new Date().toISOString()
      };
      
      const cloudPayload = sanitizePayload(newShift);

      try {
        const { error } = await supabase.from('timesheets').insert([cloudPayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Clocking in locally.");
      }
      await timesheetsCollection.insert(newShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const clockOutMutation = useMutation({
    mutationFn: async (timesheetId: string) => {
      const existing = timesheets.find(t => t.id === timesheetId);
      if (!existing) throw new Error("Active shift not found");
      
      const updatedShift: Timesheet = {
        ...existing,
        clock_out: new Date().toISOString(),
        status: 'Completed' as const
      };
      
      const cloudPayload = sanitizePayload(updatedShift);

      try {
        const { error } = await supabase.from('timesheets').update(cloudPayload).eq('id', timesheetId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Clocking out locally.");
      }
      
      // Architectural Rule 3: Strict draft object mutation
      await timesheetsCollection.update(updatedShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const payload: Timesheet = { ...timesheet, id: crypto.randomUUID(), is_deleted: false };
      
      const cloudPayload = sanitizePayload(payload);

      try {
        const { error } = await supabase.from('timesheets').insert([cloudPayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding timesheet locally.");
      }
      await timesheetsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = timesheets.find(t => t.id === id);
      if (!existing) throw new Error("Timesheet not found");
      
      const cloudPayload = sanitizePayload({ is_deleted: true });

      try {
        const { error } = await supabase.from('timesheets').update(cloudPayload).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting timesheet locally.");
      }
      
      // Architectural Rule 3: Strict draft object mutation
      const deletedShift: Timesheet = { ...existing, is_deleted: true };
      await timesheetsCollection.update(deletedShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  return {
    timesheets: timesheets.filter(t => !t.is_deleted),
    isLoading,
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addTimesheet: addTimesheetMutation.mutateAsync,
    deleteTimesheet: deleteTimesheetMutation.mutateAsync,
    isMutating: clockInMutation.isPending || clockOutMutation.isPending || addTimesheetMutation.isPending || deleteTimesheetMutation.isPending
  };
}