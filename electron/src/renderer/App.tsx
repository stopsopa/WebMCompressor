import { useState, useEffect, useCallback } from 'react';
import './App.css';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import RejectionModal from './components/RejectionModal';
import GlobalSettings from './components/GlobalSettings';
import type { VideoFile, AppConfig } from './types';

function App() {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<{ path: string; error: string }[]>([]);
  const [isConfigValid, setIsConfigValid] = useState(true);
  const [config, setConfig] = useState<AppConfig>({
    scale: false,
    videoWidth: null,
    videoHeight: null,
  });

  useEffect(() => {
    window.electronAPI.loadConfig().then(loadedConfig => {
      if (loadedConfig) {
        // Strictly filter to Phase 2 allowed fields only
        setConfig({
          scale: !!loadedConfig.scale,
          videoWidth: typeof loadedConfig.videoWidth === 'number' ? loadedConfig.videoWidth : null,
          videoHeight: typeof loadedConfig.videoHeight === 'number' ? loadedConfig.videoHeight : null,
        });
      }
    });
  }, []);

  // Sync dev helpers
  useEffect(() => {
    (window as any).getList = () => files;
    (window as any).getForm = () => config;
  }, [files, config]);

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    window.electronAPI.saveConfig(newConfig);
  };

  const handleValidationChange = useCallback((isValid: boolean) => {
    setIsConfigValid(isValid);
  }, []);

  const handleFilesDrop = async (filePaths: string[]) => {
    if (!isConfigValid) return;

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
        settings: { 
          scale: config.scale,
          videoWidth: config.videoWidth || undefined,
          videoHeight: config.videoHeight || undefined
        }
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
      {/* FORM SECTION (Top) */}
      <GlobalSettings 
        config={config} 
        onChange={handleConfigChange} 
        onValidationChange={handleValidationChange}
      />

      {/* DROPZONE SECTION (Middle) */}
      <DropZone onFilesDrop={handleFilesDrop} disabled={!isConfigValid} />

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
