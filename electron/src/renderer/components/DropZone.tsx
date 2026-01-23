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

    console.log('Files dropped:', e.dataTransfer.files);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('Files array:', files);
    
    // In Electron, File objects have a 'path' property
    const filePaths = files
      .map(file => {
        // Try to get the path property (Electron-specific)
        const electronFile = file as any;
        console.log('File object:', file, 'Path:', electronFile.path);
        return electronFile.path || null;
      })
      .filter((path): path is string => path !== null);

    console.log('Extracted file paths:', filePaths);

    if (filePaths.length > 0) {
      onFilesDrop(filePaths);
    } else {
      console.warn('No valid file paths found');
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
