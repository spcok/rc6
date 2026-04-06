import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { supabase } from '../../../lib/supabase';

interface BugReport {
  id: string;
  created_at: string;
  message: string;
  is_online: boolean;
  url: string;
  role: string;
  user_name: string;
}

interface ParsedMessage {
  severity: string;
  title: string;
  description: string;
}

const BugReports: React.FC = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let isMounted = true;
    
    const fetchReports = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('bug_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setReports(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading bug reports:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReports();
    return () => { isMounted = false; };
  }, []);

  const parseMessage = (message: string): ParsedMessage => {
    const lines = message.split('\n');
    const firstLine = lines[0] || '';
    
    const severityMatch = firstLine.match(/\[(.*?)\]/);
    const severity = severityMatch ? severityMatch[1] : 'Medium';
    
    const title = firstLine.replace(/\[.*?\]/, '').trim() || 'Untitled Report';
    
    const doubleNewlineIndex = message.indexOf('\n\n');
    const description = doubleNewlineIndex !== -1 
      ? message.substring(doubleNewlineIndex + 2).trim() 
      : lines.slice(1).join('\n').trim();

    return { severity, title, description };
  };

  const handleResolve = async (id: string) => {
    if (!isOnline) return alert("Must be online to resolve bugs.");
    try {
      const { error } = await supabase.from('bug_reports').delete().eq('id', id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error resolving bug report:', err);
      alert('Failed to resolve report. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (s.includes('high')) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (s.includes('medium')) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (s.includes('low')) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  return (
    <div className="space-y-6">
      {/* UI logic preserved for brevity, utilizing the new state natively */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Beta Feedback & Bug Reports</h2>
          <p className="text-sm text-slate-500">Review and manage feedback submitted by users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh reports"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {isLoading ? (
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
         </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bug className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No reports yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4">Report Details</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => {
                  const parsed = parseMessage(report.message);
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-6 align-top">
                         <div className="font-bold text-slate-900">{report.user_name}</div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="space-y-2 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(parsed.severity)}`}>
                              {parsed.severity}
                            </span>
                            <h4 className="font-bold text-slate-900">{parsed.title}</h4>
                          </div>
                          <p className="text-slate-600 whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {parsed.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top text-right">
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={!isOnline}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-30"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReports;
