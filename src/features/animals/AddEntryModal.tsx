import React from 'react';
import { Animal, LogType, LogEntry, ClinicalNote } from '../../types';
import HusbandryEntryModal from '../husbandry/AddEntryModal';
import { AddClinicalNoteModal } from '../medical/AddClinicalNoteModal';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: Partial<LogEntry>) => Promise<void>;
  animal: Animal;
  initialType: LogType;
  initialDate?: string;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  animal, 
  initialType,
  initialDate
}) => {
  if (!isOpen) return null;

  const handleHusbandrySave = async (entry: Partial<LogEntry>) => {
    try {
      if (onSave) await onSave(entry);
    } catch (err) {
      console.error("🛠️ [Animals QA] Failed to save husbandry log:", err);
    }
  };

  const handleMedicalSave = async (note: Partial<ClinicalNote>) => {
    try {
      // Logic would be implemented here to save medical note
      console.log("Saving note:", note);
      onClose();
    } catch (err) {
      console.error("🛠️ [Animals QA] Failed to save medical log:", err);
    }
  };

  // Route to Medical Modal
  if (initialType === LogType.HEALTH) {
    return (
      <AddClinicalNoteModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleMedicalSave}
        animals={[animal]} // Pass only current animal for context
        initialData={null}
      />
    );
  }

  // Route to Husbandry Modal for everything else (including WEIGHT, GENERAL, FEED, etc.)
  return (
    <HusbandryEntryModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave || handleHusbandrySave}
      animal={animal}
      initialType={initialType}
      initialDate={initialDate || new Date().toISOString().split('T')[0]}
    />
  );
};

export default AddEntryModal;
