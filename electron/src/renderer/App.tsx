import { useState } from 'react';
import './App.css';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import RejectionModal from './components/RejectionModal';
import type { VideoFile } from './types';

function App() {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<{ path: string; error: string }[]>([]);

  const handleFilesDrop = async (filePaths: string[]) => {
    const newRejected: { path: string; error: string }[] = [];
    const currentlyProcessingPaths = new Set<string>();
    
    // Process files
    for (const filePath of filePaths) {
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      
      // Prevent duplicates: check existing files AND files being added in this batch
      if (files.some(f => f.path === filePath) || currentlyProcessingPaths.has(filePath)) {
        console.log(`Skipping duplicate: ${filePath}`);
        continue;
      }

      currentlyProcessingPaths.add(filePath);
      const fileId = crypto.randomUUID();
      
      // Add temporary entry with 'validating' status
      const tempEntry: VideoFile = {
        id: fileId,
        path: filePath,
        name: fileName,
        outputPath: '',
        width: 0,
        height: 0,
        fps: 0,
        durationMs: 0,
        status: 'validating',
        progress: 0,
        error: null,
        startTime: null,
        endTime: null,
        currentPass: null,
        settings: { scale: false }
      };

      setFiles(prev => [...prev, tempEntry]);

      try {
        const meta = await window.electronAPI.validateVideo(filePath);
        
        if (meta.success) {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'queued', 
                  width: meta.width!, 
                  height: meta.height!, 
                  fps: meta.fps!, 
                  durationMs: meta.durationMs! 
                } 
              : f
          ));
        } else {
          // Remove from list and add to rejected
          setFiles(prev => prev.filter(f => f.id !== fileId));
          newRejected.push({ path: filePath, error: meta.error || 'Unknown error' });
        }
      } catch (err: any) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        newRejected.push({ path: filePath, error: err.message || 'Validation failed' });
      }
    }

    if (newRejected.length > 0) {
      setRejectedFiles(prev => [...prev, ...newRejected]);
    }
  };

  return (
    <div className="app-container">
      {/* FORM SECTION (Top) - Reserved for Phase 2 */}
      <div className="card">
        <h2 className="section-title">Global Settings</h2>
        <div style={{ color: 'var(--aws-text-light)', fontStyle: 'italic', fontSize: '0.9rem' }}>
          Form parameters will be implemented in Phase 2.
        </div>
      </div>

      {/* DROPZONE SECTION (Middle) */}
      <DropZone onFilesDrop={handleFilesDrop} />

      {/* LIST SECTION (Bottom) */}
      <FileList files={files} />

      {/* Rejection Modal */}
      {rejectedFiles.length > 0 && (
        <RejectionModal 
          files={rejectedFiles} 
          onClose={() => setRejectedFiles([])} 
        />
      )}
    </div>
  );
}

export default App;
