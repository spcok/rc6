import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AddEntryModal from './AddEntryModal';
import { Animal, LogType, LogEntry } from '../../types';
import { formatWeightDisplay, parseLegacyWeightToGrams } from '../../services/weightUtils';
import { getUKLocalDate } from '../../services/temporalService';
import { useDailyLogData } from './useDailyLogData'; 

interface HusbandryLogsProps {
  animalId?: string;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs_oz';
  animal?: Animal; // Keep for modal context
}

const validHusbandryTypes = ['FEED', 'WEIGHT', 'FLIGHT', 'TRAINING', 'TEMPERATURE'];

const HusbandryLogs: React.FC<HusbandryLogsProps> = ({ animalId, weightUnit = 'g', animal }) => {
  const effectiveAnimalId = animalId || animal?.id;
  const { 
    dailyLogs: logs, 
    isLoading: loading,
    addLogEntry,
    updateLogEntry,
    deleteLogEntry
  } = useDailyLogData('all', 'all', effectiveAnimalId);
  
  const [filter, setFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | undefined>(undefined);
  
  const filters = ['ALL', ...validHusbandryTypes];

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    let baseLogs = logs.filter(log => validHusbandryTypes.includes(log.logType?.toUpperCase() || ''));
    if (filter !== 'ALL') {
      baseLogs = baseLogs.filter(log => log.logType?.toUpperCase() === filter);
    }
    // Sort by date descending
    return baseLogs.sort((a, b) => {
      const dateA = new Date(a.logDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.logDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [logs, filter]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
  });

  const renderLogValue = useCallback((log: LogEntry) => {
    if (log.logType?.toUpperCase() === 'WEIGHT') {
      const grams = parseLegacyWeightToGrams(log.value);
      if (grams !== null && !isNaN(grams)) {
        return formatWeightDisplay(grams, weightUnit as 'g' | 'kg' | 'oz' | 'lbs_oz');
      }
    }
    return log.value || log.notes || '—';
  }, [weightUnit]);

  const getTypeColor = (type: string) => {
    const safeType = type?.toUpperCase();
    switch (safeType) {
      case 'FEED': return 'bg-emerald-100 text-emerald-800';
      case 'WEIGHT': return 'bg-blue-100 text-blue-800';
      case 'FLIGHT': return 'bg-purple-100 text-purple-800';
      case 'TRAINING': return 'bg-amber-100 text-amber-800';
      case 'TEMPERATURE': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleSaveLog = async (entry: Partial<LogEntry>) => {
    try {
      if (selectedLog) {
        await updateLogEntry(entry as LogEntry);
      } else {
        await addLogEntry(entry);
      }
      setIsAddModalOpen(false);
      setSelectedLog(undefined);
    } catch (err: unknown) {
      console.error('Failed to save log:', err);
      if (err instanceof Error) {
        alert(`Database Error: ${err.message}`);
      } else {
        alert('Failed to save log');
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await deleteLogEntry(id);
    } catch (err: unknown) {
      console.error('Failed to delete log:', err);
      if (err instanceof Error) {
        alert(`Delete Error: ${err.message}`);
      } else {
        alert('Failed to delete log');
      }
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <button 
        onClick={() => { setSelectedLog(undefined); setIsAddModalOpen(true); }}
        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition w-fit"
      >
        <Plus size={16} /> + ADD HUSBANDRY LOG
      </button>

      {loading ? (
        <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-lg bg-white">
          <Loader2 className="animate-spin mx-auto" size={24} />
          <p className="mt-2 text-sm font-medium">Loading logs...</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
          {/* Pseudo Table Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 grid grid-cols-12 gap-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest sticky top-0 z-10">
            <div className="col-span-3 md:col-span-2">Date</div>
            <div className="col-span-3 md:col-span-2">Type</div>
            <div className="col-span-4 md:col-span-5">Value</div>
            <div className="col-span-2 md:col-span-3 text-right pr-2">Initials / Actions</div>
          </div>

          {/* Virtualized Body */}
          <div ref={parentRef} className="h-[500px] overflow-auto custom-scrollbar bg-slate-50/30">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium text-sm">
                No husbandry logs found.
              </div>
            ) : (
              <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                {virtualizer.getVirtualItems().map(virtualRow => {
                  const log = filteredLogs[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="px-4 border-b border-slate-100 grid grid-cols-12 gap-4 items-center hover:bg-white transition-colors bg-transparent"
                    >
                      <div className="col-span-3 md:col-span-2 text-xs md:text-sm text-slate-700 font-medium">
                        {new Date(log.logDate || log.createdAt || 0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${getTypeColor(log.logType || '')}`}>
                          {log.logType}
                        </span>
                      </div>
                      <div className="col-span-4 md:col-span-5 font-bold text-slate-900 truncate pr-2 text-sm" title={renderLogValue(log)}>
                        {renderLogValue(log)}
                      </div>
                      <div className="col-span-2 md:col-span-3 flex items-center justify-end gap-3 text-slate-500 font-bold uppercase text-xs">
                        <span className="hidden md:inline-block">{log.userInitials || '—'}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setSelectedLog(log); setIsAddModalOpen(true); }} 
                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Log"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLog(log.id!)} 
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Log"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {isAddModalOpen && (animal || true) && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setSelectedLog(undefined); }}
          onSave={handleSaveLog}
          animal={animal!}
          existingLog={selectedLog}
          initialType={LogType.FEED}
          initialDate={getUKLocalDate()}
        />
      )}
    </div>
  );
};

export default HusbandryLogs;
