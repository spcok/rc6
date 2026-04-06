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
        
        const mappedData: Timesheet[] = data.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          staffName: item.staff_name as string,
          date: item.date as string,
          clockIn: item.clock_in as string,
          clockOut: item.clock_out as string | undefined,
          totalHours: item.total_hours as number | undefined,
          notes: item.notes as string | undefined,
          status: item.status as TimesheetStatus,
          updatedAt: (item.updated_at || item.created_at) as string,
          isDeleted: item.is_deleted as boolean
        }));

        // 2. REFRESH FAILOVER (Background)
        mappedData.forEach(item => {
          // Architectural Rule 3: Strict draft object mutation
          timesheetsCollection.update(item).catch(() => timesheetsCollection.insert(item));
        });
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Falling back to 14-day local vault.");
        // 3. OFFLINE FAILOVER
        return await timesheetsCollection.getAll();
      }
    }
  });

  const clockInMutation = useMutation({
    mutationFn: async (staffName: string) => {
      const newShift: Timesheet = {
        id: crypto.randomUUID(),
        staffName,
        date: new Date().toISOString().split('T')[0],
        clockIn: new Date().toISOString(),
        status: 'Active' as const,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };
      
      const cloudPayload = sanitizePayload({
        id: newShift.id,
        staff_name: newShift.staffName,
        date: newShift.date,
        clock_in: newShift.clockIn,
        status: newShift.status,
        is_deleted: newShift.isDeleted,
        created_at: newShift.updatedAt
      });

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
        clockOut: new Date().toISOString(),
        status: 'Completed' as const
      };
      
      const cloudPayload = sanitizePayload({
        clock_out: updatedShift.clockOut,
        status: updatedShift.status
      });

      try {
        const { error } = await supabase.from('timesheets').update(cloudPayload).eq('id', timesheetId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Clocking out locally.");
      }
      
      await timesheetsCollection.update(updatedShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const payload: Timesheet = { ...timesheet, id: crypto.randomUUID(), isDeleted: false };
      
      const cloudPayload = sanitizePayload({
        id: payload.id,
        staff_name: payload.staffName,
        date: payload.date,
        clock_in: payload.clockIn,
        clock_out: payload.clockOut,
        total_hours: payload.totalHours,
        notes: payload.notes,
        status: payload.status,
        updated_at: payload.updatedAt,
        is_deleted: payload.isDeleted
      });

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
      
      const deletedShift: Timesheet = { ...existing, isDeleted: true };
      await timesheetsCollection.update(deletedShift);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  return {
    timesheets: timesheets.filter(t => !t.isDeleted),
    isLoading,
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addTimesheet: addTimesheetMutation.mutateAsync,
    deleteTimesheet: deleteTimesheetMutation.mutateAsync,
    isMutating: clockInMutation.isPending || clockOutMutation.isPending || addTimesheetMutation.isPending || deleteTimesheetMutation.isPending
  };
}