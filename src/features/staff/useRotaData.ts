import { useLiveQuery } from '@tanstack/react-db';
import { rotaCollection } from '../../lib/database';
import { Shift } from '../../types';

export const useRotaData = () => {
  const { data: shifts = [], isLoading } = useLiveQuery(rotaCollection);

  const addShift = async (shift: Partial<Shift>) => {
    const payload = {
      ...shift,
      id: shift.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_deleted: false
    };
    await rotaCollection.insert(payload as Shift);
    return payload;
  };

  const updateShift = async (shift: Partial<Shift>) => {
    const existing = shifts.find(s => s.id === shift.id);
    if (existing) {
      await rotaCollection.update({ ...existing, ...shift } as Shift);
      return shift as Shift;
    }
  };

  const deleteShift = async (id: string) => {
    const existing = shifts.find(s => s.id === id);
    if (existing) {
      await rotaCollection.update({ ...existing, is_deleted: true });
    }
  };

  return { 
    shifts: shifts.filter(s => !s.is_deleted), 
    isLoading, 
    addShift,
    updateShift,
    deleteShift
  };
};
