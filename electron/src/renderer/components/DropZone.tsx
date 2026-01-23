import { useCallback } from 'react';
import './DropZone.css';

interface DropZoneProps {
  onFilesDrop: (filePaths: string[]) => void;
}

function DropZone({ onFilesDrop }: DropZoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    
    // In modern Electron, we use webUtils.getPathForFile (exposed via our preload)
    const filePaths = files
      .map(file => {
        try {
          const path = window.electronAPI.getPathForFile(file);
          console.log(`File: ${file.name}, Path: ${path}`);
          return path;
        } catch (err) {
          console.error('Error getting path for file:', file.name, err);
          return null;
        }
      })
      .filter((path): path is string => !!path);

    if (filePaths.length > 0) {
      onFilesDrop(filePaths);
    } else {
      console.warn('No valid file paths could be extracted.');
    }
  }, [onFilesDrop]);

  return (
    <div
      className="drop-zone"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="drop-zone-content">
        <span className="drop-zone-icon">📁</span>
        <span className="drop-zone-text">Drop videos here to compress</span>
      </div>
    </div>
  );
}

export default DropZone;
