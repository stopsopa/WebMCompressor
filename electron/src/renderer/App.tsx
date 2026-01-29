import { useState, useEffect, useCallback } from 'react';
import './App.css';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import RejectionModal from './components/RejectionModal';
import GlobalFormSettings from './components/GlobalSettings';
import EditModal from './components/EditModal';
import ErrorModal from './components/ErrorModal';
import CommandModal from './components/CommandModal';
import Footer from './components/Footer';
import type { VideoFile, AppConfig, FormSettings } from './types';

function App() {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<{ path: string; error: string }[]>([]);
  const [isConfigValid, setIsConfigValid] = useState(true);
  // const [activeProcessCount, setActiveProcessCount] = useState(0); // Removed as per diff

  const [config, setConfig] = useState<AppConfig>({
    form: {
      scale: false,
      videoWidth: null,
      videoHeight: null,
    },
    settings: {
      parallelProcessing: 1,
    }
  });
  const [editingFile, setEditingFile] = useState<VideoFile | null>(null);
  const [commandToShow, setCommandToShow] = useState<string | null>(null);
  const [errorToShow, setErrorToShow] = useState<{ name: string; error: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isModalLock, setIsModalLock] = useState(false);

  useEffect(() => {
    window.electronAPI.loadConfig().then(loadedConfig => {
      if (loadedConfig && loadedConfig.form && loadedConfig.settings) {
        setConfig({
          form: {
            scale: !!loadedConfig.form.scale,
            videoWidth: typeof loadedConfig.form.videoWidth === 'number' ? loadedConfig.form.videoWidth : null,
            videoHeight: typeof loadedConfig.form.videoHeight === 'number' ? loadedConfig.form.videoHeight : null,
          },
          settings: {
            parallelProcessing: typeof loadedConfig.settings.parallelProcessing === 'number' ? loadedConfig.settings.parallelProcessing : 1,
          }
        });
      }
    });
  }, []);

  // Sync dev helpers
  useEffect(() => {
    (window as any).getList = () => files;
    (window as any).getForm = () => config.form;
    (window as any).getSettings = () => config.settings;
  }, [files, config]);

  // IPC Listeners (Phase 4)
  useEffect(() => {
    const unbindProgress = window.electronAPI.onCompressionProgress((id: string, progress: any) => {
      setFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          progress: progress.progressPercentNum,
          currentPass: 2,
          pass2ProgressData: {
            progressPercentNum: progress.progressPercentNum,
            totalTimePassedHuman: progress.totalTimePassedHuman,
            estimatedTotalTimeHuman: progress.estimatedTotalTimeHuman,
            estimatedRemainingTimeHuman: progress.estimatedRemainingTimeHuman,
          }
        } : f
      ));
    });

    const unbindEnd = window.electronAPI.onCompressionEnd((id: string, step: string, error: string | null, duration: string) => {
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f;
        
        if (error) {
          return { ...f, status: 'error', error };
        }
        
        if (step === 'first') {
          return { 
            ...f, 
            pass1Duration: duration,
            currentPass: 2
          };
        }

        if (step === 'second') {
          return { 
            ...f, 
            status: 'complete', 
            progress: 100,
            pass2Duration: duration,
            currentPass: null
          };
        }
        
        return f;
      }));
    });

    return () => {
      unbindProgress();
      unbindEnd();
    };
  }, []);

  // Queue Manager (Phase 4)
  useEffect(() => {
    if (!isConverting || isModalLock) return;

    // 1. Check if we can start more jobs
    const activeCount = files.filter(f => f.status === 'processing').length;
    if (activeCount >= config.settings.parallelProcessing) return;

    // 2. Find next queued file
    const nextFile = files.find(f => f.status === 'queued' && !f.isEditing);
    
    if (!nextFile) {
      if (activeCount === 0) {
        setIsConverting(false);
      }
      return;
    }

    // 3. Start compression
    setFiles(prev => prev.map(f => 
      f.id === nextFile.id ? { 
        ...f, 
        status: 'processing',
        currentPass: 1,
        pass1Duration: undefined,
        pass2Duration: undefined,
        pass2ProgressData: undefined
      } : f
    ));

    window.electronAPI.startCompression({
      id: nextFile.id,
      sourceFile: nextFile.path,
      settings: nextFile.settings,
      metadata: {
        width: nextFile.width,
        height: nextFile.height,
        fps: nextFile.fps
      }
    });

  }, [files, config.settings.parallelProcessing, isConverting, isModalLock]);

  // Update process count in main process for close confirmation
  useEffect(() => {
    const activeCount = files.filter(f => f.status === 'processing').length;
    window.electronAPI.setProcessCount(activeCount);
  }, [files]);

  const isFormValid = (f: FormSettings) => {
    if (!f.scale) return true;
    const hasWidth = typeof f.videoWidth === 'number' && f.videoWidth > 0;
    const hasHeight = typeof f.videoHeight === 'number' && f.videoHeight > 0;
    return (hasWidth || hasHeight) && !(hasWidth && hasHeight);
  };

  const handleFormChange = (newForm: FormSettings) => {
    const newConfig = { ...config, form: newForm };
    setConfig(newConfig);
    if (isFormValid(newForm)) {
      window.electronAPI.saveConfig(newConfig);
    }
  };

  const handleParallelChange = (count: number) => {
    const newConfig = { ...config, settings: { ...config.settings, parallelProcessing: count } };
    setConfig(newConfig);
    if (isFormValid(config.form)) {
      window.electronAPI.saveConfig(newConfig);
    }
  };

  const handleValidationChange = useCallback((isValid: boolean) => {
    setIsConfigValid(isValid);
  }, []);

  const handleModalLock = useCallback((locked: boolean) => {
    setIsModalLock(locked);
    if (!locked) {
      setIsConverting(false);
    }
  }, []);

  const handleApplyToAll = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      settings: { ...config.form }
    })));
  };

  const handleStartEdit = (file: VideoFile) => {
    setEditingFile(file);
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, isEditing: true } : f
    ));
  };

  const handleSaveEdit = (settings: FormSettings) => {
    if (editingFile) {
      setFiles(prev => prev.map(f => 
        f.id === editingFile.id 
          ? { ...f, settings: { ...settings }, isEditing: false } 
          : f
      ));
      setEditingFile(null);
    }
  };

  const handleCancelEdit = () => {
    if (editingFile) {
      setFiles(prev => prev.map(f => 
        f.id === editingFile.id ? { ...f, isEditing: false } : f
      ));
      setEditingFile(null);
    }
  };

  const handleClear = () => {
    setFiles([]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleRemoveMultipleFiles = (ids: string[]) => {
    const idSet = new Set(ids);
    setFiles(prev => prev.filter(f => !idSet.has(f.id)));
  };

  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    setFiles(prev => {
      const result = [...prev];
      const [removed] = result.splice(dragIndex, 1);
      result.splice(hoverIndex, 0, removed);
      return result;
    });
  };

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
        size: 0,
        status: 'validating',
        progress: 0,
        error: null,
        startTime: null,
        endTime: null,
        currentPass: null,
        settings: { 
          scale: config.form.scale,
          videoWidth: config.form.videoWidth,
          videoHeight: config.form.videoHeight
        }
      };

      setFiles(prev => [...prev, tempEntry]);

      try {
        const meta = await window.electronAPI.validateVideo(filePath, { 
          scale: config.form.scale,
          videoWidth: config.form.videoWidth,
          videoHeight: config.form.videoHeight
        });
        
        if (meta.success) {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'queued', 
                  width: meta.width!, 
                  height: meta.height!, 
                  fps: meta.fps!, 
                  durationMs: meta.durationMs!,
                  size: meta.size!,
                  outputPath: meta.outputPath || ''
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
      <GlobalFormSettings 
        form={config.form} 
        onChange={handleFormChange} 
        onValidationChange={handleValidationChange}
        onApplyToAll={handleApplyToAll}
      />

      {/* DROPZONE SECTION (Middle) */}
      <DropZone onFilesDrop={handleFilesDrop} disabled={!isConfigValid} />

      {/* LIST SECTION (Bottom) */}
      <FileList 
        files={files} 
        parallelProcessing={config.settings.parallelProcessing}
        onParallelChange={handleParallelChange}
        onEdit={handleStartEdit} 
        onClear={handleClear}
        onRemove={handleRemoveFile}
        onRemoveMultiple={handleRemoveMultipleFiles}
        onReorder={handleReorder}
        onShowCommand={setCommandToShow}
        onShowError={(name: string, error: string) => setErrorToShow({ name, error })}
        isConverting={isConverting}
        onStartConverting={() => setIsConverting(true)}
        onModalLock={handleModalLock}
      />

      {/* Rejection Modal */}
      {rejectedFiles.length > 0 && (
        <RejectionModal 
          files={rejectedFiles} 
          onClose={() => setRejectedFiles([])} 
        />
      )}

      {/* Edit Modal */}
      {editingFile && (
        <EditModal 
          file={editingFile}
          onSave={handleSaveEdit}
          onClose={handleCancelEdit}
        />
      )}

      {/* Command Modal */}
      {commandToShow && (
        <CommandModal 
          command={commandToShow}
          onClose={() => setCommandToShow(null)}
        />
      )}

      {/* Error Modal */}
      {errorToShow && (
        <ErrorModal 
          fileName={errorToShow.name}
          error={errorToShow.error}
          onClose={() => setErrorToShow(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
