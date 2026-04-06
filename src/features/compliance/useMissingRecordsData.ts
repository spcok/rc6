import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animalsCollection, dailyLogsCollection, medicalLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogType, Animal, ClinicalNote, DailyLog } from '../../types';

export interface MissingRecordAlert {
  id: string;
  animalId: string;
  animalName: string;
  animalCategory: string;
  alertType: 'Missing Weight' | 'Missing Feed' | 'Overdue Checkup' | 'Missing Details';
  daysOverdue: number;
  severity: 'High' | 'Medium';
  category: 'Husbandry' | 'Health' | 'Details';
  missingFields?: string[];
}

export interface HusbandryLogStatus {
  animalId: string;
  animalName: string;
  animalCategory: string;
  weights: boolean[]; // 7 days
  feeds: boolean[];   // 7 days
}

export interface ComplianceStats {
  animalId: string;
  detailsScore: number;
  healthScore: number;
  husbandryScore: number;
  missingFields: string[];
  daysUntilCheckup: number | null;
}

export function useMissingRecordsData() {
  const { data: animals = [], isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;
        for (const item of data) {
          try {
            await animalsCollection.update(item as Animal);
          } catch {
            await animalsCollection.insert(item as Animal);
          }
        }
        return data as Animal[];
      } catch {
        console.warn("Network unreachable. Serving animals from local vault.");
        return await animalsCollection.getAll();
      }
    }
  });

  const { data: dailyLogs = [], isLoading: isLoadingDailyLogs } = useQuery<DailyLog[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;
        for (const item of data) {
          try {
            await dailyLogsCollection.update(item as DailyLog);
          } catch {
            await dailyLogsCollection.insert(item as DailyLog);
          }
        }
        return data as DailyLog[];
      } catch {
        console.warn("Network unreachable. Serving daily logs from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });

  const { data: medicalLogs = [], isLoading: isLoadingMedicalLogs } = useQuery<ClinicalNote[]>({
    queryKey: ['medicalLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('medical_logs').select('*');
        if (error) throw error;
        for (const item of data) {
          try {
            await medicalLogsCollection.update(item as ClinicalNote);
          } catch {
            await medicalLogsCollection.insert(item as ClinicalNote);
          }
        }
        return data as ClinicalNote[];
      } catch {
        console.warn("Network unreachable. Serving medical logs from local vault.");
        return await medicalLogsCollection.getAll();
      }
    }
  });

  const isLoading = isLoadingAnimals || isLoadingDailyLogs || isLoadingMedicalLogs;

  const { alerts, complianceStats, categoryCompliance, husbandryStatus } = useMemo(() => {
    const activeAnimals = animals.filter(a => !a.is_deleted && !a.archived);
    if (!activeAnimals.length) return { alerts: [], complianceStats: [], categoryCompliance: {}, husbandryStatus: [] };
    
    const allAlerts: MissingRecordAlert[] = [];
    const allComplianceStats: ComplianceStats[] = [];
    const now = new Date();
    const sectionData: Record<string, { husbandry: number[], details: number[], health: number[] }> = {};

    for (const animal of activeAnimals) {
      const animalLogs = dailyLogs.filter(l => l.animalId === animal.id);
      
      // Compliance Scoring
      const mandatoryFields: (keyof Animal)[] = ['microchipId', 'sex', 'acquisitionDate', 'latinName', 'ringNumber', 'redListStatus'];
      const missingFields: string[] = [];
      mandatoryFields.forEach(field => {
        if (!animal[field]) {
          missingFields.push(field.replace(/([A-Z])/g, ' $1').trim());
        }
      });
      const detailsScore = Math.round(((mandatoryFields.length - missingFields.length) / mandatoryFields.length) * 100);

      // Husbandry Scoring (Last 7 days)
      const weightsPresent = Array(7).fill(false);
      const feedsPresent = Array(7).fill(false);
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = animalLogs.filter(log => log.logDate.startsWith(dateStr));
        weightsPresent[i] = dayLogs.some(l => l.logType === LogType.WEIGHT);
        feedsPresent[i] = dayLogs.some(l => l.logType === LogType.FEED);
      }
      const husbandryScore = Math.round(((weightsPresent.filter(Boolean).length + feedsPresent.filter(Boolean).length) / 14) * 100);

      // Health Scoring
      const animalMedicalLogs = medicalLogs.filter(l => l.animalId === animal.id);
      const checkupLogs = animalMedicalLogs
        .filter(log => log.noteType.toLowerCase().includes('checkup') || log.noteType.toLowerCase().includes('medical'))
        .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
      
      const latestCheckup = checkupLogs[0];
      let daysUntilCheckup = null;
      let healthScore: number;
      
      if (latestCheckup) {
        const diffDays = Math.floor((now.getTime() - new Date(latestCheckup.date as string).getTime()) / (1000 * 60 * 60 * 24));
        daysUntilCheckup = 365 - diffDays;
        healthScore = Math.max(0, Math.min(100, Math.round((daysUntilCheckup / 365) * 100)));
      } else {
        healthScore = 0;
      }

      allComplianceStats.push({
        animalId: animal.id,
        detailsScore,
        healthScore,
        husbandryScore,
        missingFields,
        daysUntilCheckup
      });

      if (!sectionData[animal.category]) {
        sectionData[animal.category] = { husbandry: [], details: [], health: [] };
      }
      sectionData[animal.category].husbandry.push(husbandryScore);
      sectionData[animal.category].details.push(detailsScore);
      sectionData[animal.category].health.push(healthScore);

      // 1. Audit Weights (Last 14 days)
      const weightLogs = animalLogs
        .filter(log => log.logType === LogType.WEIGHT)
        .sort((a, b) => new Date(b.logDate as string).getTime() - new Date(a.logDate as string).getTime());

      const latestWeight = weightLogs[0];
      const weightThreshold = 14;
      
      if (!latestWeight) {
        allAlerts.push({
          id: `weight-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name,
          animalCategory: animal.category,
          alertType: 'Missing Weight',
          daysOverdue: 999,
          severity: 'Medium',
          category: 'Husbandry'
        });
      } else {
        const lastDate = new Date(latestWeight.log_date as string);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > weightThreshold) {
          allAlerts.push({
            id: `weight-${animal.id}`,
            animalId: animal.id,
            animalName: animal.name,
            animalCategory: animal.category,
            alertType: 'Missing Weight',
            daysOverdue: diffDays,
            severity: 'Medium',
            category: 'Husbandry'
          });
        }
      }

      // 1b. Audit Feeds (Last 7 days)
      const feedLogs = animalLogs
        .filter(log => log.logType === LogType.FEED)
        .sort((a, b) => new Date(b.logDate as string).getTime() - new Date(a.logDate as string).getTime());

      const latestFeed = feedLogs[0];
      const feedThreshold = 7;
      
      if (!latestFeed) {
        allAlerts.push({
          id: `feed-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name,
          animalCategory: animal.category,
          alertType: 'Missing Feed',
          daysOverdue: 999,
          severity: 'Medium',
          category: 'Husbandry'
        });
      } else {
        const lastDate = new Date(latestFeed.log_date as string);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > feedThreshold) {
          allAlerts.push({
            id: `feed-${animal.id}`,
            animalId: animal.id,
            animalName: animal.name,
            animalCategory: animal.category,
            alertType: 'Missing Feed',
            daysOverdue: diffDays,
            severity: 'Medium',
            category: 'Husbandry'
          });
        }
      }

      // 2. Audit Medical (Last 365 days)
      const checkupThreshold = 365;

      if (!latestCheckup) {
        allAlerts.push({
          id: `medical-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name,
          animalCategory: animal.category,
          alertType: 'Overdue Checkup',
          daysOverdue: 999,
          severity: 'High',
          category: 'Health'
        });
      } else {
        const lastDate = new Date(latestCheckup.date as string);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > checkupThreshold) {
          allAlerts.push({
            id: `medical-${animal.id}`,
            animalId: animal.id,
            animalName: animal.name,
            animalCategory: animal.category,
            alertType: 'Overdue Checkup',
            daysOverdue: diffDays,
            severity: 'High',
            category: 'Health'
          });
        }
      }

      // 3. Audit Animal Details
      if (missingFields.length > 0) {
        allAlerts.push({
          id: `details-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name,
          animalCategory: animal.category,
          alertType: 'Missing Details',
          daysOverdue: 0,
          severity: 'Medium',
          category: 'Details',
          missingFields
        });
      }
    }

    const categoryCompliance: Record<string, { husbandry: number, details: number, health: number }> = {};
    for (const category in sectionData) {
      const d = sectionData[category];
      categoryCompliance[category] = {
        husbandry: Math.round(d.husbandry.reduce((a, b) => a + b, 0) / d.husbandry.length),
        details: Math.round(d.details.reduce((a, b) => a + b, 0) / d.details.length),
        health: Math.round(d.health.reduce((a, b) => a + b, 0) / d.health.length)};
    }

    const husbandryStatus: HusbandryLogStatus[] = activeAnimals.map(animal => {
      const animalLogs = dailyLogs.filter(l => l.animalId === animal.id);
      const weights = Array(7).fill(false);
      const feeds = Array(7).fill(false);
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = animalLogs.filter(log => log.logDate.startsWith(dateStr));
        weights[i] = dayLogs.some(l => l.logType === LogType.WEIGHT);
        feeds[i] = dayLogs.some(l => l.logType === LogType.FEED);
      }
      return {
        animalId: animal.id,
        animalName: animal.name,
        animalCategory: animal.category,
        weights,
        feeds
      };
    });

    return {
      alerts: allAlerts.sort((a, b) => {
        if (a.severity === b.severity) return b.daysOverdue - a.daysOverdue;
        return a.severity === 'High' ? -1 : 1;
      }),
      complianceStats: allComplianceStats,
      categoryCompliance,
      husbandryStatus
    };
  }, [animals, dailyLogs, medicalLogs]);

  return {
    alerts,
    complianceStats,
    categoryCompliance,
    husbandryStatus,
    isLoading
  };
}

