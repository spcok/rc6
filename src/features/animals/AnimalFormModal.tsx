import React, { useState } from 'react';
import { Check, Loader2, Shield, Skull, X } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { v4 as uuidv4 } from 'uuid';
import { Animal, EntityType, HazardRating, ConservationStatus, AnimalCategory } from '../../types';
import { useAnimalsData } from './useAnimalsData';

interface Props {
  isOpen: boolean;
  initialData?: Animal;
  onClose: () => void;
}

const isUUID = (id: string | undefined): boolean => {
  if (!id) return false;
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return regex.test(id);
};

const AnimalFormModal: React.FC<Props> = ({ isOpen, initialData, onClose }) => {
  const { addAnimal, updateAnimal } = useAnimalsData();
  const [category, setCategory] = useState<AnimalCategory>(initialData?.category || AnimalCategory.OWLS);

  const isBird = category === AnimalCategory.OWLS || category === AnimalCategory.RAPTORS;

  const form = useForm({
    defaultValues: initialData || {
      id: uuidv4(),
      name: '',
      species: '',
      latinName: '',
      category: AnimalCategory.OWLS,
      dob: new Date().toISOString().split('T')[0],
      isDobUnknown: false,
      sex: 'Unknown',
      location: '',
      description: '',
      specialRequirements: '',
      imageUrl: `https://picsum.photos/seed/${uuidv4()}/400/400`,
      distributionMapUrl: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      origin: 'Unknown',
      sireId: '',
      damId: '',
      microchipId: '',
      ringNumber: '',
      hasNoId: false,
      hazardRating: HazardRating.LOW,
      isVenomous: false,
      redListStatus: ConservationStatus.NE,
      entityType: EntityType.INDIVIDUAL,
      parentMobId: '',
      censusCount: undefined,
      displayOrder: 0,
      archived: false,
      isQuarantine: false,
      ambientTempOnly: false,
      waterTippingTemp: undefined,
      targetDayTempC: undefined,
      targetNightTempC: undefined,
      targetHumidityMinPercent: undefined,
      targetHumidityMaxPercent: undefined,
      mistingFrequency: '',
      acquisitionType: 'UNKNOWN',
      isBoarding: false,
      criticalHusbandryNotes: [],
    },
    onSubmit: async ({ value }) => {
      const data = value;
      
      const sanitizedData = {
        ...data,
        parentMobId: (isUUID(data.parentMobId) ? data.parentMobId : undefined) as string | undefined,
        sireId: (isUUID(data.sireId) ? data.sireId : undefined) as string | undefined,
        damId: (isUUID(data.damId) ? data.damId : undefined) as string | undefined,
        dob: (data.dob === "" || data.dob === null ? undefined : data.dob) as string | undefined,
        acquisitionDate: (data.acquisitionDate === "" || data.acquisitionDate === null ? undefined : data.acquisitionDate) as string | undefined,
        microchipId: (data.microchipId === "" || data.microchipId === null ? undefined : data.microchipId) as string | undefined,
        ringNumber: (data.ringNumber === "" || data.ringNumber === null ? undefined : data.ringNumber) as string | undefined,
        latinName: (data.latinName === "" || data.latinName === null ? undefined : data.latinName) as string | undefined,
        description: (data.description === "" || data.description === null ? undefined : data.description) as string | undefined,
        origin: (data.origin === "" || data.origin === null ? undefined : data.origin) as string | undefined,
        mistingFrequency: (data.mistingFrequency === "" || data.mistingFrequency === null ? undefined : data.mistingFrequency) as string | undefined,
        specialRequirements: (data.specialRequirements === "" || data.specialRequirements === null ? undefined : data.specialRequirements) as string | undefined,
        targetDayTempC: (data.targetDayTempC === null ? undefined : data.targetDayTempC) as number | undefined,
        targetNightTempC: (data.targetNightTempC === null ? undefined : data.targetNightTempC) as number | undefined,
        targetHumidityMinPercent: (data.targetHumidityMinPercent === null ? undefined : data.targetHumidityMinPercent) as number | undefined,
        targetHumidityMaxPercent: (data.targetHumidityMaxPercent === null ? undefined : data.targetHumidityMaxPercent) as number | undefined,
        waterTippingTemp: (data.waterTippingTemp === null ? undefined : data.waterTippingTemp) as number | undefined,
        censusCount: (data.censusCount === null ? undefined : data.censusCount) as number | undefined,
        distributionMapUrl: (data.distributionMapUrl === "" || data.distributionMapUrl === null ? undefined : data.distributionMapUrl) as string | undefined,
        acquisitionType: (data.acquisitionType === null ? undefined : data.acquisitionType) as Animal['acquisitionType'] | undefined,
      };

      const targetId = data.id || uuidv4();
      const payload = {
        ...sanitizedData,
        id: targetId,
        imageUrl: data.imageUrl,
        criticalHusbandryNotes: Array.isArray(sanitizedData.criticalHusbandryNotes) 
            ? sanitizedData.criticalHusbandryNotes 
            : (typeof sanitizedData.criticalHusbandryNotes === 'string' 
                ? (sanitizedData.criticalHusbandryNotes as string).split('\n').map((n: string) => n.trim()).filter((n: string) => n.length > 0)
                : []),
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
        isDeleted: false
      };
      
      if (initialData) {
          await updateAnimal(payload as Animal);
      } else {
          await addAnimal(payload as Omit<Animal, 'id'>);
      }
      onClose();
    },
  });

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(); }}>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Animal' : 'Add New Animal'}</h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelClass}>Name</label>
                                    <form.Field
                                        name="name"
                                        children={(field) => (
                                            <input
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className={inputClass}
                                                placeholder="Name..."
                                            />
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Species</label>
                                    <form.Field
                                        name="species"
                                        children={(field) => (
                                            <input
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className={inputClass}
                                                placeholder="Species..."
                                            />
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Latin Name</label>
                                    <form.Field
                                        name="latinName"
                                        children={(field) => (
                                            <input
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className={inputClass}
                                                placeholder="Latin name..."
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Category</label>
                                    <form.Field
                                        name="category"
                                        children={(field) => (
                                            <select
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    field.handleChange(e.target.value as AnimalCategory);
                                                    setCategory(e.target.value as AnimalCategory);
                                                }}
                                                className={inputClass}
                                            >
                                                {(Object.values(AnimalCategory) as AnimalCategory[]).map((c: AnimalCategory) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Sex</label>
                                    <form.Field
                                        name="sex"
                                        children={(field) => (
                                            <select
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Unknown">Unknown</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Identification & Status</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelClass}>Date of Birth</label>
                                    <div className="flex gap-2">
                                        <form.Field
                                            name="dob"
                                            children={(field) => (
                                                <input
                                                    type="date"
                                                    name={field.name}
                                                    value={field.state.value || ''}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    className={inputClass}
                                                    disabled={form.getFieldValue('isDobUnknown')}
                                                />
                                            )}
                                        />
                                        <div className="flex items-center gap-2">
                                            <form.Field
                                                name="isDobUnknown"
                                                children={(field) => (
                                                    <input
                                                        type="checkbox"
                                                        name={field.name}
                                                        checked={field.state.value}
                                                        onBlur={field.handleBlur}
                                                        onChange={(e) => field.handleChange(e.target.checked)}
                                                    />
                                                )}
                                            />
                                            <span className="text-xs text-slate-500">No DOB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <form.Field
                                        name="microchipId"
                                        children={(field) => (
                                            <input
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                className={`${inputClass} font-mono`}
                                                placeholder="Microchip..."
                                            />
                                        )}
                                    />
                                    {isBird && (
                                        <form.Field
                                            name="ringNumber"
                                            children={(field) => (
                                                <input
                                                    name={field.name}
                                                    value={field.state.value || ''}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    className={`${inputClass} font-mono`}
                                                    placeholder="Ring..."
                                                />
                                            )}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>Hazard Class</label>
                                    <form.Field
                                        name="hazardRating"
                                        children={(field) => (
                                            <select
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value as HazardRating)}
                                                className={inputClass}
                                            >
                                                {(Object.values(HazardRating) as HazardRating[]).map((h: HazardRating) => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-md border border-slate-300 hover:border-blue-500 transition-all">
                                        <form.Field
                                            name="isVenomous"
                                            children={(field) => (
                                                <input
                                                    type="checkbox"
                                                    name={field.name}
                                                    checked={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Skull size={14}/> Venomous</span>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-200 pb-2">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Shield size={20}/>
                            <p className="text-xs font-medium">I verify this record is an accurate entry into the statutory stock ledger.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors">Discard</button>
                            <button type="submit" disabled={form.state.isSubmitting} className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                {form.state.isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                                {form.state.isSubmitting ? 'Authorizing...' : 'Authorize'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AnimalFormModal;
