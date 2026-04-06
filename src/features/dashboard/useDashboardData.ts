import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animalsCollection, dailyLogsCollection, tasksCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Animal, AnimalCategory, LogType, LogEntry, Task, DailyLog } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export interface EnhancedAnimal extends Animal {
  todayWeight?: LogEntry;
  todayFeed?: LogEntry;
  lastFedStr: string;
  displayId: string;
  nextFeedTask?: { due_date: string; notes?: string };
}

export interface AnimalStatsData {
  todayWeight?: { weight?: number; weight_unit?: string; weight_grams?: number; value?: string | number; log_date?: string | Date };
  previousWeight?: { weight?: number; weight_unit?: string; weight_grams?: number; value?: string | number; log_date?: string | Date };
  todayFeed?: { value?: string | number; log_date?: string | Date };
}

export interface PendingTask {
  id: string;
  title: string;
  due_date?: string;
}

export function useDashboardData(activeTab: AnimalCategory | 'ARCHIVED', viewDate: string) {
  
  // 1. Fetch Animals
  const { data: rawAnimals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;
        const mappedData = data.map(item => mapToCamelCase<Animal>(item));
        for (const item of mappedData) {
          try {
            await animalsCollection.update(item);
          } catch {
            await animalsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving animals from local vault.");
        return await animalsCollection.getAll();
      }
    }
  });

  // 2. Fetch Logs
  const { data: rawLogs = [], isLoading: logsLoading } = useQuery<DailyLog[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;
        const mappedData = data.map(item => mapToCamelCase<DailyLog>(item));
        for (const item of mappedData) {
          try {
            await dailyLogsCollection.update(item);
          } catch {
            await dailyLogsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving daily logs from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });

  // 3. Fetch Tasks
  const { data: rawTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        const mappedData = data.map(item => mapToCamelCase<Task>(item));
        for (const item of mappedData) {
          try {
            await tasksCollection.update(item);
          } catch {
            await tasksCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving tasks from local vault.");
        return await tasksCollection.getAll();
      }
    }
  });

  const isLoading = animalsLoading || logsLoading || tasksLoading;

  // Filter base datasets
  const liveAnimals = useMemo(() => rawAnimals.filter(a => !a.isDeleted && !a.archived), [rawAnimals]);
  const archivedAnimals = useMemo(() => rawAnimals.filter(a => !a.isDeleted && a.archived), [rawAnimals]);
  const logs = useMemo(() => rawLogs.filter(l => !l.isDeleted), [rawLogs]);
  const tasks = useMemo(() => rawTasks.filter(t => !t.isDeleted), [rawTasks]);
  
  // FIXED: Sync with UI Date Selector
  const todayLogsFiltered = useMemo(() => logs.filter(l => l.logDate === viewDate), [logs, viewDate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('alpha-asc');
  const [isOrderLocked, setIsOrderLocked] = useState(false);

  // Compute Animal Stats
  const animalStats = useMemo(() => {
    let filtered = liveAnimals;
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      filtered = filtered.filter(a => a.category === activeTab);
    }
    
    const filteredIds = new Set(filtered.map(a => a.id));
    const todayLogs = todayLogsFiltered.filter(l => filteredIds.has(l.animalId));
    
    const weighed = new Set(todayLogs.filter(l => l.logType === LogType.WEIGHT).map(l => l.animalId)).size;
    const fed = new Set(todayLogs.filter(l => l.logType === LogType.FEED).map(l => l.animalId)).size;

    return { total: filtered.length, weighed, fed, animalData: new Map<string, AnimalStatsData>() };
  }, [liveAnimals, activeTab, todayLogsFiltered]);

  // Compute Task Stats
  const taskStats = useMemo(() => {
    const pendingTasks = tasks.filter(t => !t.completed && t.type !== 'HEALTH').map(t => ({ id: t.id, title: t.title, due_date: t.due_date }));
    const pendingHealth = tasks.filter(t => !t.completed && t.type === 'HEALTH').map(t => ({ id: t.id, title: t.title, due_date: t.due_date }));
    return { pendingTasks, pendingHealth };
  }, [tasks]);

  // Build the Final UI List
  const filteredAnimals = useMemo(() => {
    let result = activeTab === 'ARCHIVED' ? [...archivedAnimals] : [...liveAnimals];
    
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      result = result.filter(a => a.category === activeTab);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(lower) || 
        a.species?.toLowerCase().includes(lower) || 
        a.latinName?.toLowerCase().includes(lower)
      );
    }
    
    if (sortOption === 'alpha-asc') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortOption === 'alpha-desc') result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));

    // Map the rich data onto the animal rows
    return result.map(animal => {
      const animalTodayLogs = todayLogsFiltered.filter(l => l.animalId === animal.id);
      const todayWeight = animalTodayLogs.find(l => l.logType === LogType.WEIGHT);
      const todayFeed = animalTodayLogs.find(l => l.logType === LogType.FEED);
      
      const animalAllLogs = logs.filter(l => l.animalId === animal.id);
      const feedLogs = animalAllLogs.filter(l => l.logType === LogType.FEED).sort((a, b) => {
          const timeA = new Date(a.createdAt || a.logDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.logDate || 0).getTime();
          return timeB - timeA;
      });
      
      const lastFedStr = feedLogs[0] ? `${feedLogs[0].value} ${new Date(feedLogs[0].createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-';
      const displayId = (animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) ? (animal.ringNumber || '-') : (animal.microchipId || '-');
      
      return { ...animal, todayWeight, todayFeed, lastFedStr, displayId } as EnhancedAnimal;
    });
  }, [liveAnimals, archivedAnimals, activeTab, searchTerm, sortOption, logs, todayLogsFiltered]);

  const toggleOrderLock = (locked: boolean) => setIsOrderLocked(locked);
  const cycleSort = () => setSortOption(prev => prev === 'alpha-asc' ? 'alpha-desc' : prev === 'alpha-desc' ? 'custom' : 'alpha-asc');

  return { filteredAnimals, animalStats, taskStats, isLoading, searchTerm, setSearchTerm, sortOption, cycleSort, isOrderLocked, toggleOrderLock };
}
