import { useState, useMemo } from 'react';
import { Truck, Plus, History, MapPin, Calendar, User as UserIcon, ArrowRight, Plane, Lock } from 'lucide-react';
import { useMovementsData } from './useMovementsData';
import { useTransfersData } from './useTransfersData';
import AddMovementModal from './AddMovementModal';
import AddTransferModal from './AddTransferModal';
import { usePermissions } from '../../hooks/usePermissions';
import { DataTable } from '../../components/ui/DataTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { InternalMovement, Transfer } from '../../types';

const movementColumnHelper = createColumnHelper<InternalMovement>();
const transferColumnHelper = createColumnHelper<Transfer>();

export default function Movements() {
  const { view_movements } = usePermissions();
  const { movements, isLoading } = useMovementsData();
  const { transfers } = useTransfersData();
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const movementColumns = useMemo(() => [
    movementColumnHelper.accessor('log_date', {
      header: 'Date',
      cell: info => (
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
          <Calendar size={14} className="text-slate-400" />
          {new Date(info.getValue()).toLocaleDateString('en-GB')}
        </div>
      )
    }),
    movementColumnHelper.accessor('animal_name', {
      header: 'Animal',
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Truck size={16} />
          </div>
          <span className="font-semibold text-slate-900">{info.getValue()}</span>
        </div>
      )
    }),
    movementColumnHelper.accessor('movement_type', {
      header: 'Type',
      cell: info => <span className="text-sm font-medium text-slate-500">{info.getValue()}</span>
    }),
    movementColumnHelper.accessor(row => row, {
      id: 'route',
      header: 'Route',
      cell: info => {
        const m = info.getValue();
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
              <MapPin size={14} className="text-slate-400" />
              {m.source_location}
            </div>
            <ArrowRight className="text-slate-300" size={16} />
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
              <MapPin size={14} className="text-slate-400" />
              {m.destination_location}
            </div>
          </div>
        );
      }
    }),
    movementColumnHelper.accessor('created_by', {
      header: 'Authorized By',
      cell: info => (
        <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
          <UserIcon size={12}/> {info.getValue()}
        </div>
      )
    })
  ] as unknown as ColumnDef<InternalMovement, unknown>[], []);

  const transferColumns = useMemo(() => [
    transferColumnHelper.accessor('date', {
      header: 'Date',
      cell: info => (
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
          <Calendar size={14} className="text-slate-400" />
          {new Date(info.getValue()).toLocaleDateString('en-GB')}
        </div>
      )
    }),
    transferColumnHelper.accessor('animal_name', {
      header: 'Animal',
      cell: info => {
        const type = info.row.original.transfer_type;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              type === 'Arrival' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Plane size={16} />
            </div>
            <span className="font-semibold text-slate-900">{info.getValue()}</span>
          </div>
        );
      }
    }),
    transferColumnHelper.accessor('transfer_type', {
      header: 'Type',
      cell: info => {
        const type = info.getValue();
        return (
          <span className={`text-sm font-medium ${
            type === 'Arrival' ? 'text-emerald-600' : 'text-amber-600'
          }`}>{type}</span>
        );
      }
    }),
    transferColumnHelper.accessor('institution', {
      header: 'Institution',
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()}</span>
    }),
    transferColumnHelper.accessor('cites_article_10_ref', {
      header: 'CITES / A10',
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue() || '—'}</span>
    }),
    transferColumnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        return (
          <div className={`px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${
            status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {status}
          </div>
        );
      }
    })
  ] as unknown as ColumnDef<Transfer, unknown>[], []);

  if (!view_movements) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex flex-col items-center gap-2 max-w-md text-center">
          <Lock size={48} className="opacity-50" />
          <h2 className="text-lg font-bold uppercase tracking-tight">Access Restricted</h2>
          <p className="text-sm font-medium">You do not have permission to view Logistics & Movements. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading movements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Logistics & Movements</h1>
          <p className="text-sm text-slate-500 mt-1">Record of internal transfers and external acquisitions/dispositions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18}/> Record {activeTab === 'internal' ? 'Movement' : 'Transfer'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('internal')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'internal' ? 'bg-blue-50 text-blue-700 rounded-xl font-bold' : 'text-slate-600 hover:bg-slate-100 rounded-xl'
          }`}
        >
          Internal Movements
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'external' ? 'bg-blue-50 text-blue-700 rounded-xl font-bold' : 'text-slate-600 hover:bg-slate-100 rounded-xl'
          }`}
        >
          External Transfers
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'internal' ? (
          movements && movements.length > 0 ? (
            <DataTable columns={movementColumns} data={movements} pageSize={10} />
          ) : (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-200">
              <History size={48} className="mx-auto mb-4 text-slate-200"/>
              <p className="text-slate-500 text-sm font-medium">No internal records found</p>
            </div>
          )
        ) : (
          transfers && transfers.length > 0 ? (
            <DataTable columns={transferColumns} data={transfers} pageSize={10} />
          ) : (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-200">
              <History size={48} className="mx-auto mb-4 text-slate-200"/>
              <p className="text-slate-500 text-sm font-medium">No external records found</p>
            </div>
          )
        )}
      </div>

      {isModalOpen && (
        activeTab === 'internal' 
          ? <AddMovementModal onClose={() => setIsModalOpen(false)} />
          : <AddTransferModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
