import { useTransition, useEffect } from 'react';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Animal, AnimalCategory, HazardRating, ConservationStatus, EntityType } from '../../types';
import { batchGetSpeciesData } from '../../services/geminiService';
import { uploadFile } from '../../services/uploadService';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';

export const animalFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  latinName: z.string().nullable().optional(),
  category: z.nativeEnum(AnimalCategory),
  dob: z.string().nullable().optional(),
  isDobUnknown: z.boolean(),
  sex: z.enum(['Male', 'Female', 'Unknown']),
  location: z.string().min(1, 'Location is required'),
  description: z.string().nullable().optional(),
  specialRequirements: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  distributionMapUrl: z.string().nullable().optional(),
  acquisitionDate: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  sireId: z.string().nullable().optional(),
  damId: z.string().nullable().optional(),
  microchipId: z.string().nullable().optional(),
  ringNumber: z.string().nullable().optional(),
  hasNoId: z.boolean(),
  hazardRating: z.nativeEnum(HazardRating),
  isVenomous: z.boolean(),
  redListStatus: z.nativeEnum(ConservationStatus),
  entityType: z.nativeEnum(EntityType).nullable().optional(),
  parentMobId: z.string().nullable().optional(),
  censusCount: z.number().nullable().optional(),
  displayOrder: z.number(),
  archived: z.boolean(),
  isQuarantine: z.boolean(),
  ambientTempOnly: z.boolean().optional(),
  waterTippingTemp: z.number().nullable().optional(),
  winterWeightG: z.number().nullable().optional(),
  targetDayTempC: z.number().nullable().optional(),
  targetNightTempC: z.number().nullable().optional(),
  targetHumidityMinPercent: z.number().nullable().optional(),
  targetHumidityMaxPercent: z.number().nullable().optional(),
  mistingFrequency: z.string().nullable().optional(),
  acquisitionType: z.enum(['BORN', 'TRANSFERRED_IN', 'RESCUE', 'UNKNOWN']).nullable().optional(),
  criticalHusbandryNotes: z.string().nullable().optional(),
  isBoarding: z.boolean().optional(),
});

export type AnimalFormData = z.infer<typeof animalFormSchema>;

interface UseAnimalFormProps {
  initialData?: Animal | null;
  onClose: () => void;
}

export function useAnimalForm({ initialData }: Omit<UseAnimalFormProps, 'onClose'> & { initialData?: Animal | null }) {
  const [isAiPending, startAiTransition] = useTransition();

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: initialData ? {
      name: initialData.name || '',
      species: initialData.species || '',
      latinName: initialData.latinName || '',
      category: initialData.category || AnimalCategory.OWLS,
      dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
      isDobUnknown: initialData.isDobUnknown || false,
      sex: initialData.sex || 'Unknown',
      location: initialData.location || '',
      description: initialData.description || '',
      specialRequirements: initialData.specialRequirements || '',
      imageUrl: initialData.imageUrl || '',
      distributionMapUrl: initialData.distributionMapUrl || '',
      acquisitionDate: initialData.acquisitionDate ? new Date(initialData.acquisitionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      origin: initialData.origin || 'Unknown',
      sireId: initialData.sireId || '',
      damId: initialData.damId || '',
      microchipId: initialData.microchipId || '',
      ringNumber: initialData.ringNumber || '',
      hasNoId: initialData.hasNoId || false,
      hazardRating: initialData.hazardRating || HazardRating.LOW,
      isVenomous: initialData.isVenomous || false,
      redListStatus: initialData.redListStatus || ConservationStatus.NE,
      entityType: initialData.entityType || EntityType.INDIVIDUAL,
      parentMobId: initialData.parentMobId || '',
      censusCount: initialData.censusCount,
      displayOrder: initialData.displayOrder || 0,
      archived: initialData.archived || false,
      isQuarantine: initialData.isQuarantine || false,
      ambientTempOnly: initialData.ambientTempOnly || false,
      waterTippingTemp: initialData.waterTippingTemp,
      targetDayTempC: initialData.targetDayTempC,
      targetNightTempC: initialData.targetNightTempC,
      targetHumidityMinPercent: initialData.targetHumidityMinPercent,
      targetHumidityMaxPercent: initialData.targetHumidityMaxPercent,
      mistingFrequency: initialData.mistingFrequency || '',
      acquisitionType: initialData.acquisitionType || 'UNKNOWN',
      isBoarding: initialData.isBoarding || false,
      criticalHusbandryNotes: initialData.criticalHusbandryNotes?.join('\n') || '',
    } : {
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
      criticalHusbandryNotes: '',
    },
    onSubmit: async ({ value }) => {
      return value;
    },
  });

  const species = form.state.values.species;
  const redListStatus = form.state.values.redListStatus;

  useEffect(() => {
    const handler = setTimeout(() => {
      if (species && species.length > 2 && (redListStatus === ConservationStatus.NE || !redListStatus)) {
        if (!navigator.onLine) {
          console.warn("Offline: Automatic AI Autofill disabled.");
          return;
        }
        console.log("Automatic AI Autofill Triggered. Species:", species);
        startAiTransition(async () => {
          try {
            const data = await batchGetSpeciesData([species]);
            console.log("Automatic AI Data Received:", data);
            if (data[species]) {
              form.setFieldValue('latinName', data[species].latin_name);
              form.setFieldValue('redListStatus', data[species].conservation_status as ConservationStatus);
            }
          } catch (error) {
            console.error('Automatic AI Autofill failed:', error);
          }
        });
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [species, redListStatus, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'distributionMapUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFile(file, 'animals', 'profiles');
        form.setFieldValue(field, url);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  return {
    form,
    isAiPending,
    handleImageUpload,
  };
}
