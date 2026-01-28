import React from 'react';
import SettingsForm from './SettingsForm';
import type { FormSettings } from '../types';

interface GlobalSettingsProps {
  form: FormSettings;
  onChange: (form: FormSettings) => void;
  onValidationChange: (isValid: boolean) => void;
  onApplyToAll?: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ form, onChange, onValidationChange, onApplyToAll }) => {
  return (
    <div className="global-settings-wrapper">
      <SettingsForm 
        title="Global Settings"
        config={form}
        onChange={onChange}
        onValidationChange={onValidationChange}
        onApplyToAll={onApplyToAll}
      />
    </div>
  );
};

export default GlobalSettings;
