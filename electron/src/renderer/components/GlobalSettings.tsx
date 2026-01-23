import type { AppConfig, QualityPreset, ResolutionMode } from '../types';
import './GlobalSettings.css';

interface GlobalSettingsProps {
  config: AppConfig;
  onConfigChange: (update: Partial<AppConfig>) => void;
}

function GlobalSettings({ config, onConfigChange }: GlobalSettingsProps) {
  return (
    <div className="global-settings">
      <h3 className="settings-title">Global Settings</h3>
      
      <div className="settings-row">
        <label>
          Quality:
          <select
            value={config.defaultQuality}
            onChange={(e) => onConfigChange({ defaultQuality: e.target.value as QualityPreset })}
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
            value={config.defaultResolution}
            onChange={(e) => onConfigChange({ defaultResolution: e.target.value as ResolutionMode })}
          >
            <option value="original">Original</option>
            <option value="maxWidth">Max Width</option>
            <option value="maxHeight">Max Height</option>
          </select>
        </label>

        {config.defaultResolution === 'maxWidth' && (
          <label>
            Max Width (px):
            <input
              type="number"
              value={config.maxWidth || ''}
              onChange={(e) => onConfigChange({ maxWidth: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="1920"
            />
          </label>
        )}

        {config.defaultResolution === 'maxHeight' && (
          <label>
            Max Height (px):
            <input
              type="number"
              value={config.maxHeight || ''}
              onChange={(e) => onConfigChange({ maxHeight: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="1080"
            />
          </label>
        )}

        <label>
          Size/Second (KB/s):
          <input
            type="number"
            value={config.sizePerSecond || ''}
            onChange={(e) => onConfigChange({ sizePerSecond: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Optional"
          />
        </label>

        <label>
          Parallel:
          <select
            value={config.parallelProcessing}
            onChange={(e) => onConfigChange({ parallelProcessing: parseInt(e.target.value) })}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default GlobalSettings;
