import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useTimesheetData } from '../../features/staff/useTimesheetData';
import { useAuthStore } from '../../store/authStore';
import { TimesheetStatus } from '../../types';

export const ClockInButton: React.FC = () => {
  const { timesheets, clockIn, clockOut } = useTimesheetData();
  const { currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const openShift = timesheets.find(t => 
    t.staffName === currentUser?.name && 
    t.status === TimesheetStatus.ACTIVE && 
    !t.clockOut
  );

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (openShift) {
        await clockOut(openShift.id);
      } else if (currentUser?.name) {
        await clockIn(currentUser.name);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`System Error: ${err.message}`);
      } else {
        alert('System Error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-sm
        ${openShift 
          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Clock size={16} className="mr-2" />}
      {openShift ? 'Clock Out' : 'Clock In'}
    </button>
  );
};
