import { useCallback, useState } from 'react';
import './DropZone.css';

interface DropZoneProps {
  onFilesDrop: (filePaths: string[]) => void;
  disabled?: boolean;
}

function DropZone({ onFilesDrop, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    
    const filePaths = files
      .map(file => {
        try {
          return window.electronAPI.getPathForFile(file);
        } catch (err) {
          console.error('Error getting path for file:', file.name, err);
          return null;
        }
      })
      .filter((path): path is string => !!path);

    if (filePaths.length > 0) {
      onFilesDrop(filePaths);
    }
  }, [onFilesDrop, disabled]);

  return (
    <div
      className={`drop-zone card ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-zone-content">
        <span className="drop-zone-icon">📥</span>
        <div className="drop-zone-text-group">
          <span className="drop-zone-text">Drag and drop video files here</span>
          <span className="drop-zone-subtext">Supported formats: MP4, MKV, MOV, AVI, etc.</span>
          {disabled && <span className="error-text">Please fix setting errors above first</span>}
        </div>
      </div>
    </div>
  );
}

export default DropZone;
