import React, { useState } from 'react';
import type { VideoFile, CompressionSettings } from '../types';
import SettingsForm from './SettingsForm';
import './EditModal.css';

interface EditModalProps {
  file: VideoFile;
  onSave: (settings: CompressionSettings) => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ file, onSave, onClose }) => {
  const [settings, setSettings] = useState<CompressionSettings>({ ...file.settings });
  const [isValid, setIsValid] = useState(true);

  const handleSave = () => {
    if (isValid) {
      onSave(settings);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Settings: {file.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <SettingsForm 
            title="Individual Video Settings"
            config={settings}
            onChange={setSettings}
            onValidationChange={setIsValid}
          />
        </div>
        <div className="modal-footer">
          <button className="aws-button aws-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="aws-button aws-button-primary" 
            onClick={handleSave}
            disabled={!isValid}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
