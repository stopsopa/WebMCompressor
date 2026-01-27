import React from 'react';
import SettingsForm from './SettingsForm';
import type { AppConfig } from '../types';

interface GlobalSettingsProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  onValidationChange: (isValid: boolean) => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ config, onChange, onValidationChange }) => {
  return (
    <div className="global-settings-wrapper">
      <SettingsForm 
        title="Global Settings"
        config={config}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
    </div>
  );
};

export default GlobalSettings;
