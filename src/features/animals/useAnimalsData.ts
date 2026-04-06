import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useAnimalsData = () => {
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;

        const mappedData: Animal[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Animal>(item));

        for (const item of mappedData) {
          try {
            await animalsCollection.update(item);
          } catch {
            await animalsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving animals from local vault.");
        return await animalsCollection.getAll();
      }
    }
  });

  const addAnimalMutation = useMutation({
    mutationFn: async (animal: Omit<Animal, 'id'>) => {
      const id = crypto.randomUUID();
      const supabasePayload = {
        id,
        entity_type: animal.entityType,
        parent_mob_id: animal.parentMobId,
        census_count: animal.censusCount,
        name: animal.name,
        species: animal.species,
        latin_name: animal.latinName,
        category: animal.category,
        location: animal.location,
        image_url: animal.imageUrl,
        hazard_rating: animal.hazardRating,
        is_venomous: animal.isVenomous,
        weight_unit: animal.weightUnit,
        dob: animal.dob,
        is_dob_unknown: animal.isDobUnknown,
        sex: animal.sex,
        microchip_id: animal.microchipId,
        disposition_status: animal.dispositionStatus,
        origin_location: animal.originLocation,
        destination_location: animal.destinationLocation,
        transfer_date: animal.transferDate,
        ring_number: animal.ringNumber,
        has_no_id: animal.hasNoId,
        red_list_status: animal.redListStatus,
        description: animal.description,
        special_requirements: animal.specialRequirements,
        critical_husbandry_notes: animal.criticalHusbandryNotes,
        target_day_temp_c: animal.targetDayTempC,
        target_night_temp_c: animal.targetNightTempC,
        target_humidity_min_percent: animal.targetHumidityMinPercent,
        target_humidity_max_percent: animal.targetHumidityMaxPercent,
        misting_frequency: animal.mistingFrequency,
        acquisition_date: animal.acquisitionDate,
        origin: animal.origin,
        sire_id: animal.sireId,
        dam_id: animal.damId,
        flying_weight_g: animal.flyingWeightG,
        winter_weight_g: animal.winterWeightG,
        display_order: animal.displayOrder,
        archived: animal.archived,
        archive_reason: animal.archiveReason,
        archived_at: animal.archivedAt,
        archive_type: animal.archiveType,
        date_of_death: animal.dateOfDeath,
        disposition_date: animal.dispositionDate,
        is_quarantine: animal.isQuarantine,
        distribution_map_url: animal.distributionMapUrl,
        water_tipping_temp: animal.waterTippingTemp,
        ambient_temp_only: animal.ambientTempOnly,
        acquisition_type: animal.acquisitionType,
        is_boarding: animal.isBoarding,
        created_at: animal.createdAt,
        updated_at: animal.updatedAt,
        is_deleted: animal.isDeleted
      };
      
      const { error } = await supabase.from('animals').insert([supabasePayload]);
      if (error) throw error;
      
      await animalsCollection.insert({ ...animal, id } as Animal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async (animal: Animal) => {
      const supabasePayload = {
        entity_type: animal.entityType,
        parent_mob_id: animal.parentMobId,
        census_count: animal.censusCount,
        name: animal.name,
        species: animal.species,
        latin_name: animal.latinName,
        category: animal.category,
        location: animal.location,
        image_url: animal.imageUrl,
        hazard_rating: animal.hazardRating,
        is_venomous: animal.isVenomous,
        weight_unit: animal.weightUnit,
        dob: animal.dob,
        is_dob_unknown: animal.isDobUnknown,
        sex: animal.sex,
        microchip_id: animal.microchipId,
        disposition_status: animal.dispositionStatus,
        origin_location: animal.originLocation,
        destination_location: animal.destinationLocation,
        transfer_date: animal.transferDate,
        ring_number: animal.ringNumber,
        has_no_id: animal.hasNoId,
        red_list_status: animal.redListStatus,
        description: animal.description,
        special_requirements: animal.specialRequirements,
        critical_husbandry_notes: animal.criticalHusbandryNotes,
        target_day_temp_c: animal.targetDayTempC,
        target_night_temp_c: animal.targetNightTempC,
        target_humidity_min_percent: animal.targetHumidityMinPercent,
        target_humidity_max_percent: animal.targetHumidityMaxPercent,
        misting_frequency: animal.mistingFrequency,
        acquisition_date: animal.acquisitionDate,
        origin: animal.origin,
        sire_id: animal.sireId,
        dam_id: animal.damId,
        flying_weight_g: animal.flyingWeightG,
        winter_weight_g: animal.winterWeightG,
        display_order: animal.displayOrder,
        archived: animal.archived,
        archive_reason: animal.archiveReason,
        archived_at: animal.archivedAt,
        archive_type: animal.archiveType,
        date_of_death: animal.dateOfDeath,
        disposition_date: animal.dispositionDate,
        is_quarantine: animal.isQuarantine,
        distribution_map_url: animal.distributionMapUrl,
        water_tipping_temp: animal.waterTippingTemp,
        ambient_temp_only: animal.ambientTempOnly,
        acquisition_type: animal.acquisitionType,
        is_boarding: animal.isBoarding,
        created_at: animal.createdAt,
        updated_at: new Date().toISOString(),
        is_deleted: animal.isDeleted
      };
      
      const { error } = await supabase.from('animals').update(supabasePayload).eq('id', animal.id);
      if (error) throw error;
      
      await animalsCollection.update(animal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const filteredAnimals = animals.filter(animal => !animal.isDeleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal: addAnimalMutation.mutateAsync,
    updateAnimal: updateAnimalMutation.mutateAsync
  };
};
