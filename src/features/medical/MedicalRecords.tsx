import React, { useState, useMemo, useRef } from 'react';
import { useMedicalData } from './useMedicalData';
import { usePermissions } from '../../hooks/usePermissions';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, Edit2, Download, CheckCircle, Lock, FileText, Printer } from 'lucide-react';
import { generateMarChartDocx } from './exportMarChart';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';

interface MedicalRecordsProps {
  animalId?: string;
  variant?: 'full' | 'quick-view';
}

const marColumnHelper = createColumnHelper<MARChart>();
const quarantineColumnHelper = createColumnHelper<QuarantineRecord>();

const MedicalRecords: React.FC<MedicalRecordsProps> = ({ animalId, variant = 'full' }) => {
  const permissions = usePermissions();
  const { clinicalNotes, marCharts, quarantineRecords, isLoading, updateQuarantineRecord } = useMedicalData(animalId);
  const [activeTab] = useState<'notes' | 'mar' | 'quarantine'>(variant === 'quick-view' ? 'notes' : 'notes');
  const [selectedPatient] = useState<string>(animalId || 'All');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);

  const filteredNotes = useMemo(() => {
    if (selectedPatient === 'All') return clinicalNotes;
    return clinicalNotes.filter(n => n.animalId === selectedPatient);
  }, [clinicalNotes, selectedPatient]);

  const filteredMarCharts = useMemo(() => {
    if (selectedPatient === 'All') return marCharts;
    return marCharts.filter(m => m.animalId === selectedPatient);
  }, [marCharts, selectedPatient]);

  const filteredQuarantineRecords = useMemo(() => {
    if (selectedPatient === 'All') return quarantineRecords;
    return quarantineRecords.filter(q => q.animalId === selectedPatient);
  }, [quarantineRecords, selectedPatient]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredNotes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  const marColumns = useMemo(() => [
    marColumnHelper.accessor('medication', {
      header: 'Medication',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>
    }),
    marColumnHelper.accessor('animalName', {
      header: 'Animal',
      cell: info => info.getValue()
    }),
    marColumnHelper.accessor(row => `${row.dosage} / ${row.frequency}`, {
      id: 'dosage_freq',
      header: 'Dosage & Freq',
      cell: info => info.getValue()
    }),
    marColumnHelper.accessor(row => row, {
      id: 'dates',
      header: 'Start-End',
      cell: info => {
        const m = info.getValue();
        return `${new Date(m.startDate as string).toLocaleDateString('en-GB')} - ${m.endDate ? new Date(m.endDate as string).toLocaleDateString('en-GB') : 'Ongoing'}`;
      }
    }),
    marColumnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
          {info.getValue()}
        </span>
      )
    }),
    marColumnHelper.accessor(row => row, {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const m = info.getValue();
        return (
          <div className="flex gap-2">
            {m.integritySeal ? (
              <span title="Record Sealed"><Lock size={16} className="text-emerald-600" /></span>
            ) : (
              <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
            )}
            <button onClick={() => generateMarChartDocx(m)} className="text-slate-400 hover:text-blue-600 transition-colors"><Download size={16} /></button>
          </div>
        );
      }
    })
  ] as unknown as ColumnDef<MARChart, unknown>[], []);

  const quarantineColumns = useMemo(() => [
    quarantineColumnHelper.accessor('animalName', {
      header: 'Animal',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>
    }),
    quarantineColumnHelper.accessor('reason', {
      header: 'Reason',
      cell: info => info.getValue()
    }),
    quarantineColumnHelper.accessor('startDate', {
      header: 'Start',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-GB')
    }),
    quarantineColumnHelper.accessor('endDate', {
      header: 'Target Release',
      cell: info => new Date(info.getValue() as string).toLocaleDateString('en-GB')
    }),
    quarantineColumnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {status}
          </span>
        );
      }
    }),
    quarantineColumnHelper.accessor('isolationNotes', {
      header: 'Notes',
      cell: info => <span className="max-w-xs truncate block">{info.getValue()}</span>
    }),
    quarantineColumnHelper.accessor(row => row, {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const q = info.getValue();
        return (
          <div className="flex gap-2">
            <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
            {q.status === 'Active' && (
              <button 
                onClick={() => updateQuarantineRecord({...q, status: 'Cleared'})}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Mark as Cleared"
              >
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        );
      }
    })
  ] as unknown as ColumnDef<QuarantineRecord, unknown>[], [updateQuarantineRecord]);

  if (!permissions.view_medical) {

    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex flex-col items-center gap-2 max-w-md text-center">
          <Lock size={48} className="opacity-50" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm font-medium">You do not have permission to view Medical Records. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Clinical Records...</div>;

  const handlePrintNote = (note: ClinicalNote) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Clinical Note - ${note.animalName}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              p { margin-bottom: 8px; }
              .label { font-weight: bold; }
              .section { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>Clinical Note: ${note.animalName}</h1>
            <p><span class="label">Date:</span> ${new Date(note.date as string).toLocaleDateString('en-GB')}</p>
            <p><span class="label">Type:</span> ${note.noteType}</p>
            <p><span class="label">Staff:</span> ${note.staffInitials}</p>
            ${note.diagnosis ? `<p><span class="label">Diagnosis:</span> ${note.diagnosis}</p>` : ''}
            ${note.bcs ? `<p><span class="label">BCS:</span> ${note.bcs}/5</p>` : ''}
            ${note.weight ? `<p><span class="label">Weight:</span> ${note.weight}${note.weightUnit || 'g'}</p>` : note.weightGrams ? `<p><span class="label">Weight:</span> ${note.weightGrams}g</p>` : ''}
            
            <div class="section">
              <h3>Clinical Observation</h3>
              <p style="white-space: pre-wrap;">${note.noteText}</p>
            </div>

            ${note.treatmentPlan ? `
              <div class="section">
                <h3>Treatment Plan</h3>
                <p style="white-space: pre-wrap;">${note.treatmentPlan}</p>
              </div>
            ` : ''}

            ${note.recheckDate ? `<div class="section"><p><span class="label">Recheck Date:</span> ${new Date(note.recheckDate as string).toLocaleDateString('en-GB')}</p></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* ... (variant headers) ... */}
      
      {/* ... (modals) ... */}
      
      {/* ... (tabs) ... */}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* ... (filter) ... */}

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Master List */}
            <div ref={parentRef} className="flex-1 w-full lg:w-2/3 h-[600px] overflow-auto border border-slate-200 rounded-xl shadow-sm">
              <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                {virtualizer.getVirtualItems().map(virtualRow => {
                  const n = filteredNotes[virtualRow.index];
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
                      onClick={() => setSelectedNote(n)}
                      className={`p-5 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${selectedNote?.id === n.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-900">{n.animalName}</h3>
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                              {n.noteType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                            <span>{new Date(n.date as string).toLocaleDateString('en-GB')}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>By: {String(n.staffInitials)}</span>
                          </div>
                          {n.diagnosis && (
                            <p className="text-sm text-slate-600 font-medium mt-1">
                              Dx: <span className="text-slate-800">{n.diagnosis}</span>
                            </p>
                          )}
                          <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                            {String(n.noteText)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredNotes.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No clinical notes found for this selection.</p>
                </div>
              )}
            </div>

            {/* Right Column: Detail Pane */}
            <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">
              {selectedNote ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedNote.animalName}</h2>
                      <p className="text-sm text-slate-500">{new Date(selectedNote.date as string).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePrintNote(selectedNote)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Print Note">
                        <Printer size={18} />
                      </button>
                      {selectedNote.integritySeal ? (
                        <button onClick={() => handleAddCorrection(selectedNote)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Add Correction">
                          <AlertTriangle size={18} />
                        </button>
                      ) : (
                        <button onClick={() => handleEditNote(selectedNote)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Note">
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                      {selectedNote.noteType}
                    </span>
                    {selectedNote.bcs && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                        BCS: {selectedNote.bcs}/5
                      </span>
                    )}
                    {selectedNote.weight ? (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                        Weight: {selectedNote.weight}{selectedNote.weightUnit || 'g'}
                      </span>
                    ) : selectedNote.weightGrams ? (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                        Weight: {selectedNote.weightGrams}g
                      </span>
                    ) : null}
                  </div>

                  {selectedNote.diagnosis && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-1">Diagnosis</h3>
                      <p className="text-slate-800 font-medium">{selectedNote.diagnosis}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Clinical Observation</h3>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedNote.noteText}
                    </p>
                  </div>

                  {selectedNote.treatmentPlan && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Treatment Plan</h3>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedNote.treatmentPlan}
                      </p>
                    </div>
                  )}

                  {(selectedNote.thumbnailUrl || selectedNote.attachmentUrl) && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Attachment</h3>
                      <div 
                        className="relative rounded-xl overflow-hidden border border-slate-200 group cursor-pointer"
                        onClick={() => {
                          if (selectedNote.attachmentUrl && !selectedNote.attachmentUrl.startsWith('local://')) {
                            if (navigator.onLine) {
                              window.open(selectedNote.attachmentUrl, '_blank');
                            } else {
                              alert('Internet connection required to view high-res image.');
                            }
                          } else if (selectedNote.attachmentUrl?.startsWith('local://')) {
                            alert('High-res image is still uploading.');
                          }
                        }}
                      >
                        <img 
                          src={selectedNote.thumbnailUrl || selectedNote.attachmentUrl} 
                          alt="Clinical attachment" 
                          className="w-full h-auto object-cover max-h-64"
                          referrerPolicy="no-referrer"
                        />
                        {selectedNote.attachmentUrl && !selectedNote.attachmentUrl.startsWith('local://') && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
                              Tap to download high-res (Internet Required)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-sm text-slate-500">
                    <span>Recorded by: <span className="font-medium text-slate-700">{selectedNote.staffInitials}</span></span>
                    {selectedNote.recheckDate && (
                      <span className="text-amber-600 font-medium">Recheck: {new Date(selectedNote.recheckDate as string).toLocaleDateString('en-GB')}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Select a clinical note to view full details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ... (other tabs) ... */}

      {variant === 'full' && activeTab === 'mar' && (
        <DataTable columns={marColumns} data={filteredMarCharts} pageSize={10} />
      )}

      {variant === 'full' && activeTab === 'quarantine' && (
        <DataTable columns={quarantineColumns} data={filteredQuarantineRecords} pageSize={10} />
      )}
    </div>
  );
};

export default MedicalRecords;
