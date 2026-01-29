import React, { useEffect, useState } from 'react';
import type { FormSettings } from '../types';
import { heightResolutions } from '../../tools/closestResolution.js';
import scaleWandH from '../../tools/scaleWandH';
import './SettingsForm.css';

interface SettingsFormProps {
  title: string;
  config: FormSettings;
  onChange: (config: FormSettings) => void;
  onValidationChange?: (isValid: boolean) => void;
  showScaleToggle?: boolean;
  onApplyToAll?: () => void;
  originalDimensions?: { width: number; height: number };
}

const SettingsForm: React.FC<SettingsFormProps> = ({ 
  title, 
  config, 
  onChange, 
  onValidationChange,
  showScaleToggle = true,
  onApplyToAll,
  originalDimensions
}) => {
  // Local state to track which radio button is selected
  // Priority: if width is present -> width, else -> height (default)
  const [activeMode, setActiveMode] = useState<'width' | 'height'>(
    config.videoWidth ? 'width' : 'height'
  );

  useEffect(() => {
    let valid = true;
    if (config.scale) {
      const hasWidth = typeof config.videoWidth === 'number' && config.videoWidth > 0;
      const hasHeight = typeof config.videoHeight === 'number' && config.videoHeight > 0;
      
      if (!hasWidth && !hasHeight) {
        valid = false;
      }
      // UI enforcement: Width and Height are mutually exclusive
      if (hasWidth && hasHeight) {
        valid = false;
      }
    }
    if (onValidationChange) {
      onValidationChange(valid);
    }
  }, [config, onValidationChange]);

  const handleScaleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, scale: e.target.checked });
  };

  const handleModeChange = (mode: 'width' | 'height') => {
    setActiveMode(mode);
    if (mode === 'width') {
      onChange({ ...config, videoHeight: null });
    } else {
      onChange({ ...config, videoWidth: null });
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ ...config, videoWidth: isNaN(val) ? null : val, videoHeight: null });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ ...config, videoHeight: isNaN(val) ? null : val, videoWidth: null });
  };
  const handleResolutionClick = (h: number) => {
    setActiveMode('height');
    onChange({ 
      ...config, 
      scale: true, 
      videoHeight: h, 
      videoWidth: null 
    });
  };
  
  const isUpscaling = React.useMemo(() => {
    if (!config.scale || !originalDimensions || (!config.videoWidth && !config.videoHeight)) {
      return false;
    }

    try {
      const scaled = scaleWandH(
        originalDimensions,
        { 
          width: config.videoWidth ?? undefined, 
          height: config.videoHeight ?? undefined 
        } as any
      );
      
      return scaled.width > originalDimensions.width || scaled.height > originalDimensions.height;
    } catch (e) {
      return false;
    }
  }, [config, originalDimensions]);

  return (
    <div className="settings-form-container card">
      <div className="settings-header">
        <div className="title-area">
          <h2 className="section-title">{title}</h2>
          {originalDimensions && (
            <span className={`original-dims-badge ${isUpscaling ? 'is-upscaling' : ''}`}>
              Original: w: {originalDimensions.width} &times; h: {originalDimensions.height}
            </span>
          )}
        </div>
        {showScaleToggle && (
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={config.scale} 
              onChange={handleScaleToggle} 
            />
            <span>Scale Video</span>
          </label>
        )}
      </div>

      <div className="settings-content">
        {config.scale ? (
          <div className="scaling-options">
            <div className="manual-resolution-v2">
              <div className={`resolution-choice ${activeMode === 'width' ? 'active' : ''}`}>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="resMode" 
                    checked={activeMode === 'width'} 
                    onChange={() => handleModeChange('width')}
                  />
                  <span className="label-text">Custom Width (px)</span>
                </label>
                <input 
                  type="number" 
                  value={config.videoWidth || ''} 
                  onChange={handleWidthChange} 
                  className="aws-input"
                  placeholder="Auto"
                  min="100"
                  disabled={activeMode !== 'width'}
                />
              </div>

              <div className={`resolution-choice ${activeMode === 'height' ? 'active' : ''}`}>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="resMode" 
                    checked={activeMode === 'height'} 
                    onChange={() => handleModeChange('height')}
                  />
                  <span className="label-text">Custom Height (px)</span>
                </label>
                <input 
                  type="number" 
                  value={config.videoHeight || ''} 
                  onChange={handleHeightChange} 
                  className="aws-input"
                  placeholder="Auto"
                  min="100"
                  disabled={activeMode !== 'height'}
                />

                <div className="resolution-short-list">
                  <label>Standard Heights:</label>
                  <div className="resolution-buttons">
                    {heightResolutions.map(h => (
                      <button 
                        key={h} 
                        type="button"
                        className={`resolution-btn ${config.videoHeight === h ? 'active' : ''}`}
                        onClick={() => handleResolutionClick(h)}
                        disabled={activeMode !== 'height'}
                      >
                        {h}p
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {config.scale && !config.videoWidth && !config.videoHeight && (
              <div className="validation-error-text">
                Please specify a value for the selected dimension.
              </div>
            )}

            {isUpscaling && (
              <div className="upscale-warning-box">
                <div className="upscale-warning-title">
                  Upscaling detected
                </div>
                <div className="upscale-warning-text">
                  The settings determined at the moment are higher than the original size of the video. This might result in quality loss.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="settings-placeholder">
            Scaling is disabled. Output will use original video dimensions.
          </div>
        )}

        {onApplyToAll && (
          <div className="settings-footer">
            <button 
              className="aws-button aws-button-secondary apply-all-btn"
              onClick={onApplyToAll}
              title="Apply these settings to all videos in the list"
            >
              Apply to All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsForm;
