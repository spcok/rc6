import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  CalendarDays, 
  ListOrdered, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRightLeft, 
  Download,
  Loader2,
  FileText,
  ChevronRight,
  Scale,
  Eye,
  Wrench
} from 'lucide-react';
import { Animal, UserRole } from '../../types';

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  exportFn: () => Promise<boolean>;
  columns: string[];
  category?: string;
}

const REPORTS: ReportDefinition[] = [
  {
    id: 'husbandry',
    title: 'Daily log',
    description: 'Export daily feeding, cleaning, and observation records.',
    icon: CalendarDays,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal ID', 'Log Type', 'Notes', 'Recorded By']
  },
  {
    id: 'internal_movements',
    title: 'Internal Movements Ledger',
    description: 'Log of all internal enclosure changes',
    category: 'facility',
    icon: ArrowRightLeft,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Species', 'From', 'To', 'Reason/Notes', 'Initials']
  },
  {
    id: 'external_transfers',
    title: 'External Transfers Ledger',
    description: 'Log of all acquisitions, loans, transfers, and deaths',
    category: 'facility',
    icon: ArrowRightLeft,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Species', 'Transfer Type', 'Origin / Destination', 'Notes', 'Initials']
  },
  {
    id: 'site_maintenance',
    title: 'Site Maintenance Ledger',
    description: 'Log of all site maintenance tasks, repairs, and statuses',
    category: 'facility',
    icon: Wrench,
    exportFn: async () => { return true; },
    columns: ['Date', 'Task / Title', 'Description', 'Priority', 'Status', 'Assigned / Initials']
  },
  {
    id: 'census',
    title: 'Annual Census',
    description: 'Complete inventory of all animals currently on site.',
    icon: ListOrdered,
    exportFn: async () => { return true; },
    columns: ['Name', 'Species', 'Category', 'Sex', 'Location']
  },
  {
    id: 'stocklist',
    title: 'Stock List (Section 9)',
    description: 'Statutory stocklist showing population changes over time.',
    icon: ArrowRightLeft,
    exportFn: async () => { return true; },
    columns: ['Species', 'Start Count', 'Births', 'Arrivals', 'Deaths', 'Departures', 'End Count']
  },
  {
    id: 'rounds',
    title: 'Rounds Checklist',
    description: 'Verification of completed daily operational rounds.',
    icon: CheckSquare,
    exportFn: async () => { return true; },
    columns: ['Date', 'Shift', 'Status', 'Completed By', 'Notes']
  },
  {
    id: 'incidents',
    title: 'Incident Log',
    description: 'Log of recorded operational and safety incidents.',
    icon: AlertTriangle,
    exportFn: async () => { return true; },
    columns: ['Date', 'Type', 'Severity', 'Description', 'Reported By']
  },
  {
    id: 'weight',
    title: 'Weight History',
    description: 'Historical weight records for all animals.',
    icon: Scale,
    exportFn: async () => { return true; },
    columns: ['Date', 'Animal', 'Weight', 'Change', 'Staff']
  },
  {
    id: 'death_certificate',
    title: 'Death Certificate',
    description: 'Generate a formal death certificate for a deceased animal.',
    icon: FileText,
    exportFn: async () => { return true; },
    columns: ['Name', 'Species', 'Date of Death']
  },
  {
    id: 'staff_rota',
    title: 'Staff Rota Schedule',
    description: 'Export scheduled staff shifts, times, and coverage areas.',
    icon: CalendarDays,
    exportFn: async () => { return true; },
    columns: ['Date', 'Staff Member', 'Role', 'Shift Type', 'Times', 'Assigned Area']
  },
  {
    id: 'inspection_package',
    title: 'Inspection Package',
    description: 'Comprehensive package including medical logs, MAR charts, and maintenance logs.',
    icon: FileText,
    exportFn: async () => { return true; },
    columns: ['Section', 'Details']
  }
];

export default function ReportsDashboard() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768); // Typical tablet/mobile breakpoint
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const [activeReportId, setActiveReportId] = useState('husbandry');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [rotaPeriod, setRotaPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('*');
      if (error) throw error;
      return data as Animal[];
    },
  });

  const archivedAnimals = animals.filter(a => a.archived);

  // Auto-calculate End Date based on the selected Rota Period
  useEffect(() => {
    if (activeReportId === 'staff_rota') {
      const start = new Date(startDate);
      const end = new Date(startDate);
      
      if (rotaPeriod === 'daily') {
        // End date is the same as start date
      } else if (rotaPeriod === 'weekly') {
        end.setDate(start.getDate() + 6);
      } else if (rotaPeriod === 'monthly') {
        end.setMonth(start.getMonth() + 1);
        end.setDate(end.getDate() - 1);
      }
      
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, rotaPeriod, activeReportId]);
  
  const uniqueSections = activeReportId === 'staff_rota'
    ? Object.values(UserRole)
    : Array.from(new Set((animals || []).map(a => (a as unknown as { section?: string, category?: string }).section || a.category).filter(Boolean))).sort();

  // Preview State
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];

  const generatePreview = async () => {
    setIsGenerating(true);
    setPreviewBlob(null);
    setError(null);

    try {
      // ... handle other reports ...
    } catch (err: unknown) {
      console.error("Failed to generate preview:", err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport.title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Desktop Required</h2>
          <p className="text-slate-600">
            Report generation requires a larger display for document preview and formatting. Please access this feature on a desktop or laptop computer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reports</h2>
          </div>
          <p className="text-sm font-medium text-slate-500">Select report type</p>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {REPORTS.map((report) => (
            <button
              key={report.id}
              onClick={() => {
                setActiveReportId(report.id);
                setPreviewBlob(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                activeReportId === report.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-sm font-medium">
                {report.title}
              </span>
              {activeReportId === report.id && (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {activeReport.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{activeReport.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm print:hidden">
          <div className="flex flex-wrap items-end gap-4">
            {activeReport?.id !== 'site_maintenance' && activeReport?.id !== 'death_certificate' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {activeReport?.id !== 'staff_rota' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                    <select 
                      value={rotaPeriod} 
                      onChange={(e) => setRotaPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
              <select 
                value={orientation} 
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {activeReport?.id !== 'site_maintenance' && activeReport?.id !== 'death_certificate' && uniqueSections.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {activeReportId === 'staff_rota' ? 'Filter by Role' : 'Animal Section'}
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{activeReportId === 'staff_rota' ? 'All Roles' : 'All Sections'}</option>
                  {uniqueSections.map(section => (
                    <option key={section as string} value={section as string}>{section as string}</option>
                  ))}
                </select>
              </div>
            )}

            {activeReport?.id === 'death_certificate' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Animal</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an animal...</option>
                  {(archivedAnimals || []).filter(a => a.archive_type === 'Death').map(animal => (
                    <option key={animal.id} value={animal.id}>{animal.name} ({animal.species})</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={generatePreview}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 h-[38px]"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Generate Preview
            </button>
            <button
              onClick={handleDownload}
              disabled={!previewBlob}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 h-[38px]"
            >
              <Download className="w-4 h-4" />
              Download Report (.docx)
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-slate-200 rounded hover:bg-slate-300">-</button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 bg-slate-200 rounded hover:bg-slate-300">+</button>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col p-4 overflow-hidden">
          {/* Preview Pane */}
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-100/50 rounded-xl border border-slate-200">
            {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
            {/* DOCX Preview Container */}
            <div style={{ zoom: zoom }} className="bg-white min-h-[600px] shadow-inner">
              <div ref={previewContainerRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
