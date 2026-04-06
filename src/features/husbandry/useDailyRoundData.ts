import { useState, useMemo, useEffect } from 'react';
import { AnimalCategory, DailyRound, LogType } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { animalsCollection, dailyLogsCollection, createStandardCollection } from '../../lib/database';

const dailyRoundsCollection = createStandardCollection('daily_rounds');

interface AnimalCheckState {
    isAlive?: boolean;
    isWatered: boolean;
    isSecure: boolean;
    securityIssue?: string;
    healthIssue?: string;
}

export function useDailyRoundData(viewDate: string) {
    const { data: allAnimals = [], isLoading: isLoadingAnimals } = useQuery({
        queryKey: ['animals'],
        queryFn: async () => await animalsCollection.getAll()
    });
    const { data: liveLogs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['dailyLogs'],
        queryFn: async () => await dailyLogsCollection.getAll()
    });
    const { data: liveRounds = [], isLoading: isLoadingRounds } = useQuery({
        queryKey: ['dailyRounds'],
        queryFn: async () => await dailyRoundsCollection.getAll()
    });
    
    const isLoading = isLoadingAnimals || isLoadingLogs || isLoadingRounds;

    const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
    const [activeTab, setActiveTab] = useState<AnimalCategory>(AnimalCategory.OWLS);
    
    const [checks, setChecks] = useState<Record<string, AnimalCheckState>>({});
    const [signingInitials, setSigningInitials] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentRound = useMemo(() => liveRounds.find(r => r.shift === roundType && r.section === activeTab && r.date === viewDate), [liveRounds, roundType, activeTab, viewDate]);
    const isPastRound = currentRound?.status?.toLowerCase() === 'completed';

    useEffect(() => {
        if (currentRound?.checkData) {
            setChecks(currentRound.checkData as Record<string, AnimalCheckState>);
        } else {
            setChecks({});
        }
        setSigningInitials(currentRound?.completedBy || '');
        setGeneralNotes(currentRound?.notes || '');
    }, [currentRound]);

    const categoryAnimals = useMemo(() => allAnimals.filter(a => a.category === activeTab), [allAnimals, activeTab]);

    const freezingRisks = useMemo(() => {
        const risks: Record<string, boolean> = {};
        if (!liveLogs) return risks;
        categoryAnimals.forEach(animal => {
            if (animal.waterTippingTemp !== undefined) {
                const tempLog = liveLogs.find(l => l.animalId === animal.id && l.logType === LogType.TEMPERATURE);
                if (tempLog && tempLog.temperatureC !== undefined && tempLog.temperatureC <= animal.waterTippingTemp) {
                    risks[animal.id] = true;
                }
            }
        });
        return risks;
    }, [categoryAnimals, liveLogs]);

    const toggleHealth = (id: string, issue?: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isAlive: prev[id]?.isAlive ? undefined : true, healthIssue: issue }
        }));
    };
    const toggleWater = (id: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isWatered: !prev[id]?.isWatered }
        }));
    };
    const toggleSecure = (id: string, issue?: string) => { 
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id], isSecure: !prev[id]?.isSecure, securityIssue: issue }
        }));
    };

    const completedChecks = useMemo(() => {
        return categoryAnimals.filter(animal => {
            const state = checks[animal.id];
            if (!state) return false;
            return (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS) 
                ? (state.isAlive !== undefined && (state.isSecure || Boolean(state.securityIssue)))
                : (state.isAlive !== undefined && state.isWatered && (state.isSecure || Boolean(state.securityIssue)));
        }).length;
    }, [categoryAnimals, checks, activeTab]);

    const totalAnimals = categoryAnimals.length;
    const progress = totalAnimals === 0 ? 0 : Math.round((completedChecks / totalAnimals) * 100);
    const isComplete = totalAnimals > 0 && completedChecks === totalAnimals;
    const isNoteRequired = useMemo(() => false, []);

    const handleSignOff = async () => {
        if (!isComplete || !signingInitials) return;
        setIsSubmitting(true);
        try {
            const roundId = currentRound?.id || crypto.randomUUID();
            
            const roundData = {
                id: roundId,
                date: viewDate,
                shift: roundType,
                section: activeTab,
                checkData: checks,
                completedBy: signingInitials,
                notes: generalNotes,
                status: 'completed',
                completedAt: new Date().toISOString()
            };

            if (currentRound) {
                await dailyRoundsCollection.update({ ...currentRound, ...roundData });
            } else {
                await dailyRoundsCollection.insert(roundData as DailyRound);
            }
        } catch (error) {
            console.error('Failed to sign off round:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentUser = { signature_data: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png' };

    return { categoryAnimals, isLoading, roundType, setRoundType, activeTab, setActiveTab, checks, progress, isComplete, isNoteRequired, signingInitials, setSigningInitials, generalNotes, setGeneralNotes, isSubmitting, isPastRound, toggleWater, toggleSecure, toggleHealth, handleSignOff, currentUser, completedChecks, totalAnimals, freezingRisks };
}
