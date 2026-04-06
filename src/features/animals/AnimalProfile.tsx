import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from '@tanstack/react-router';
import { FileText, Stethoscope, ClipboardList, ArrowLeft, ShieldAlert, Thermometer, Scale, AlertTriangle, GitMerge } from 'lucide-react';
import { useAnimalProfileData } from './useAnimalProfileData';
import { IUCNBadge } from './IUCNBadge';
import AnimalFormModal from './AnimalFormModal';
import MedicalRecords from '../medical/MedicalRecords';
import { ProfileActionBar } from './ProfileActionBar';
import HusbandryLogs from '../husbandry/HusbandryLogs';
import { formatWeightDisplay } from '../../services/weightUtils';

const SignGenerator = React.lazy(() => import('./SignGenerator'));

export interface Props {
  animalId?: string;
  onBack?: () => void;
}

export default function AnimalProfile({ animalId, onBack }: Props) {
  const { id } = useParams({ strict: false });
  const effectiveId = animalId || id || '';
  const { animal, isLoading } = useAnimalProfileData(effectiveId);
  const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'husbandry'>('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSignGeneratorOpen, setIsSignGeneratorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!animal) return <div className="p-8 text-center">Animal not found.</div>;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FileText },
    { id: 'medical', label: 'Medical', icon: Stethoscope },
    { id: 'husbandry', label: 'Husbandry', icon: ClipboardList },
  ] as const;

  return (
    <div className="space-y-4 p-2 md:p-4">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft size={18} /> Back
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[280px] xl:h-[340px] rounded-xl overflow-hidden shadow-sm">
            <img
              src={animal.imageUrl || '/offline-media-fallback.svg'}
              alt={animal.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = '/offline-media-fallback.svg'; }}
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-slate-900">{animal.name}</h1>
              <div className="flex gap-2">
                {animal.isBoarding && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full uppercase">Boarding</span>
                )}
                {animal.archived && (
                  <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase">Archived</span>
                )}
                <IUCNBadge status={animal.redListStatus} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 mb-4">
              <p className="text-slate-500 font-mono text-sm">ID: {animal.id}</p>
              <p className="text-slate-500 font-mono text-sm">Ring Number: {animal.ringNumber || 'Un-ringed'}</p>
            </div>
            
            <div className="mb-4">
              <span className="text-slate-400 block mb-1">Location</span>
              <span className="font-medium text-slate-900">{animal.location || 'Unknown'}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-sm">
              <div>
                <span className="text-slate-400 block mb-1">Species</span>
                <span className="font-medium text-slate-900">{animal.species}</span>
                {animal.latinName && (
                  <span className="block text-slate-500 italic text-xs">{animal.latinName}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Sex</span>
                <span className="font-medium text-slate-900">{animal.sex || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Status</span>
                <span className="font-medium text-slate-900">{animal.dispositionStatus || 'Active'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Origin</span>
                <span className="font-medium text-slate-900">{animal.origin || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Date of Birth</span>
                <span className="font-medium text-slate-900">
                  {animal.dob ? new Date(animal.dob as string).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Acquisition</span>
                <span className="font-medium text-slate-900">
                  {animal.acquisitionDate ? new Date(animal.acquisitionDate as string).toLocaleDateString() : 'Unknown'}
                </span>
              </div>

              {animal.flyingWeightG !== undefined && animal.flyingWeightG !== null && (
                <div>
                  <span className="text-slate-400 block mb-1">Flying Weight</span>
                  <span className="font-bold text-blue-600">
                    {formatWeightDisplay(animal.flyingWeightG, animal.weightUnit)}
                  </span>
                </div>
              )}
              {animal.winterWeightG !== undefined && animal.winterWeightG !== null && (
                <div>
                  <span className="text-slate-400 block mb-1">Winter Weight</span>
                  <span className="font-bold text-blue-600">
                    {formatWeightDisplay(animal.winterWeightG, animal.weightUnit)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <ProfileActionBar
            onEdit={() => setIsEditModalOpen(true)}
            onSign={() => setIsSignGeneratorOpen(true)}
            animal={animal}
          />
        </div>
      </div>

      {isEditModalOpen && (
        <AnimalFormModal
          isOpen={isEditModalOpen}
          initialData={animal}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {isSignGeneratorOpen && (
        isMobile ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Desktop Required</h2>
              <p className="text-slate-600 mb-6">
                Sign generation requires a larger display for document preview and formatting. Please access this feature on a desktop or laptop computer.
              </p>
              <button 
                onClick={() => setIsSignGeneratorOpen(false)}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-sm text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Loading Sign Generator...</p></div></div>}>
            <SignGenerator
              animal={animal}
              orgProfile={{ name: 'KOA', logoUrl: '' }}
              onClose={() => setIsSignGeneratorOpen(false)}
            />
          </Suspense>
        )
      )}

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition ${
                activeTab === tab.id 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:col-span-1 xl:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h3 className="font-semibold text-red-900">Critical Husbandry Notes</h3>
                </div>
                {animal.criticalHusbandryNotes && animal.criticalHusbandryNotes.length > 0 ? (
                  <ul className="list-disc list-outside ml-8 text-sm text-red-800 space-y-1">
                    {animal.criticalHusbandryNotes.map((note: string, idx: number) => <li key={idx}>{note}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-red-700">No critical notes.</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitMerge className="text-slate-500" size={20} />
                  <h3 className="font-semibold text-slate-900">Lineage & Genetics</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Sire:</span> {animal.sireId ?? 'Unknown'}</p>
                  <p><span className="text-slate-500">Dam:</span> {animal.damId ?? 'Unknown'}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="text-slate-500" size={20} />
                  <h3 className="font-semibold text-slate-900">Safety & Hazards</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Hazard Rating:</span> <span className={`font-medium ${animal.hazardRating === 'HIGH' ? 'text-red-600' : animal.hazardRating === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}`}>{animal.hazardRating ?? 'N/A'}</span></p>
                  {animal.isVenomous && <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertTriangle size={14} /> VENOMOUS</div>}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="text-slate-500" size={20} />
                  <h3 className="font-semibold text-slate-900">Weight Management</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Flying Weight:</span> {animal.flyingWeightG !== undefined ? formatWeightDisplay(animal.flyingWeightG, animal.weightUnit) : 'N/A'}</p>
                  <p><span className="text-slate-500">Winter Weight:</span> {animal.winterWeightG !== undefined ? formatWeightDisplay(animal.winterWeightG, animal.weightUnit) : 'N/A'}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="text-slate-500" size={20} />
                  <h3 className="font-semibold text-slate-900">Environmental Targets</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Day Temp Target:</span> {animal.targetDayTempC ?? 'N/A'}°C</p>
                  <p><span className="text-slate-500">Night Temp Target:</span> {animal.targetNightTempC ?? 'N/A'}°C</p>
                  <p><span className="text-slate-500">Humidity Target:</span> {animal.targetHumidityMinPercent ?? 'N/A'}% - {animal.targetHumidityMaxPercent ?? 'N/A'}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'medical' && <MedicalRecords animalId={animal.id} variant="quick-view" />}
        {activeTab === 'husbandry' && (
          <HusbandryLogs 
            animalId={animal.id} 
            weightUnit={animal.weightUnit || 'g'} 
            animal={animal} 
          />
        )}
      </div>
    </div>
  );
}
