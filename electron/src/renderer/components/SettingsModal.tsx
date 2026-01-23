import { useState } from 'react';
import type { VideoFile, CompressionSettings, QualityPreset, ResolutionMode } from '../types';
import './SettingsModal.css';

interface SettingsModalProps {
  file: VideoFile;
  onClose: () => void;
  onSave: (settings: CompressionSettings) => void;
}

function SettingsModal({ file, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<CompressionSettings>(file.settings);

  const handleSave = () => {
    onSave(settings);
  };

  const isProcessing = file.status === 'processing';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Settings for {file.name}</h3>

        {isProcessing && (
          <div className="modal-warning">
            This file is currently being processed. Settings cannot be changed.
          </div>
        )}

        <div className="modal-body">
          <label>
            Quality:
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value as QualityPreset })}
              disabled={isProcessing}
            >
              <option value="ultra">Ultra</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="tiny">Tiny</option>
            </select>
          </label>

          <label>
            Resolution:
            <select
              value={settings.resolution}
              onChange={(e) => setSettings({ ...settings, resolution: e.target.value as ResolutionMode })}
              disabled={isProcessing}
            >
              <option value="original">Original</option>
              <option value="maxWidth">Max Width</option>
              <option value="maxHeight">Max Height</option>
            </select>
          </label>

          {settings.resolution === 'maxWidth' && (
            <label>
              Max Width (px):
              <input
                type="number"
                value={settings.maxWidth || ''}
                onChange={(e) => setSettings({ ...settings, maxWidth: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="1920"
                disabled={isProcessing}
              />
            </label>
          )}

          {settings.resolution === 'maxHeight' && (
            <label>
              Max Height (px):
              <input
                type="number"
                value={settings.maxHeight || ''}
                onChange={(e) => setSettings({ ...settings, maxHeight: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="1080"
                disabled={isProcessing}
              />
            </label>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isProcessing}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
