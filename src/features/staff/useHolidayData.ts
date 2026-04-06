import { useLiveQuery } from '@tanstack/react-db';
import { holidaysCollection } from '../../lib/database';
import { Holiday } from '../../types';

export function useHolidayData() {
  const { data: holidays = [], isLoading } = useLiveQuery(holidaysCollection);

  const addHoliday = async (holiday: Omit<Holiday, 'id'>) => {
    const payload = { ...holiday, id: crypto.randomUUID() };
    await holidaysCollection.insert(payload as Holiday);
    return payload;
  };

  const deleteHoliday = async (id: string) => {
    const existing = holidays.find(h => h.id === id);
    if (existing) {
      await holidaysCollection.update({ ...existing, is_deleted: true });
    }
  };

  return {
    holidays: holidays.filter(h => !h.is_deleted),
    isLoading,
    addHoliday,
    deleteHoliday,
  };
}
