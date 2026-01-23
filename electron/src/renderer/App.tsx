import { useState, useEffect } from 'react';
import './App.css';
import DropZone from './components/DropZone';
import GlobalSettings from './components/GlobalSettings';
import Tabs from './components/Tabs';
import FileList from './components/FileList';
import LogsPanel from './components/LogsPanel';
import type { VideoFile, AppConfig, LogEntry, CompressionSettings } from './types';
import { QUALITY_PRESETS } from './types';

function App() {
  const [config, setConfig] = useState<AppConfig>({
    defaultQuality: 'medium',
    defaultResolution: 'original',
    maxWidth: null,
    maxHeight: null,
    sizePerSecond: null,
    parallelProcessing: 1,
    overwriteExisting: false,
  });

  const [files, setFiles] = useState<VideoFile[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'logs'>('files');

  // Load config on mount
  useEffect(() => {
    window.electronAPI.loadConfig().then((loadedConfig) => {
      setConfig(loadedConfig);
    });
  }, []);

  // Save config whenever it changes
  const updateConfig = (newConfig: Partial<AppConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    window.electronAPI.saveConfig(updated);
  };

  // Update process count for close confirmation
  useEffect(() => {
    const count = files.filter(f => f.status === 'processing').length;
    window.electronAPI.setProcessCount(count);
  }, [files]);

  // Add log entry
  const addLog = (entry: Omit<LogEntry, 'timestamp'>) => {
    setLogs(prev => [...prev, { ...entry, timestamp: Date.now() }]);
  };

  // Handle files dropped
  const handleFilesDrop = async (filePaths: string[]) => {
    const newFiles: VideoFile[] = [];

    for (const filePath of filePaths) {
      // Check if already in list
      if (files.some(f => f.path === filePath)) {
        continue;
      }

      const fileId = crypto.randomUUID();
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown';

      // Add to list with validating status
      const tempFile: VideoFile = {
        id: fileId,
        path: filePath,
        name: fileName,
        outputPath: '',
        duration: 0,
        fileSize: 0,
        settings: getCurrentSettings(),
        status: 'validating',
        progress: 0,
        error: null,
        startTime: null,
        endTime: null,
        currentPass: null,
      };

      newFiles.push(tempFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Validate each file
    for (const file of newFiles) {
      addLog({
        fileId: file.id,
        fileName: file.name,
        level: 'info',
        message: `Validating video file...`,
      });

      const validation = await window.electronAPI.validateVideo(file.path);

      if (validation.success) {
        const outputPath = await window.electronAPI.getOutputPath(file.path);

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? {
                ...f,
                duration: validation.duration!,
                fileSize: validation.fileSize!,
                outputPath,
                status: 'queued',
              }
            : f
        ));

        addLog({
          fileId: file.id,
          fileName: file.name,
          level: 'info',
          message: `Validation successful. Duration: ${Math.floor(validation.duration!)}s, Size: ${(validation.fileSize! / 1024 / 1024).toFixed(2)}MB`,
        });
      } else {
        setFiles(prev => prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'error', error: validation.error || 'Validation failed' }
            : f
        ));

        addLog({
          fileId: file.id,
          fileName: file.name,
          level: 'error',
          message: `Validation failed: ${validation.error}`,
        });
      }
    }
  };

  const getCurrentSettings = (): CompressionSettings => {
    return {
      quality: config.defaultQuality,
      resolution: config.defaultResolution,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      sizePerSecond: config.sizePerSecond,
    };
  };

  // Process queue - start processing files
  useEffect(() => {
    const processNext = async () => {
      const queuedFiles = files.filter(f => f.status === 'queued');
      const currentlyProcessing = files.filter(f => f.status === 'processing');

      if (currentlyProcessing.length < config.parallelProcessing && queuedFiles.length > 0) {
        const fileToProcess = queuedFiles[0];
        
        // Mark as processing
        setFiles(prev => prev.map(f =>
          f.id === fileToProcess.id
            ? { ...f, status: 'processing', startTime: Date.now(), currentPass: 1 }
            : f
        ));

        processFile(fileToProcess);
      }
    };

    processNext();
  }, [files, config.parallelProcessing]);

  // Process a single file (two-pass encoding)
  const processFile = async (file: VideoFile) => {
    const preset = QUALITY_PRESETS[file.settings.quality];
    
    // Calculate bitrate from sizePerSecond if set
    let calculatedBitrate = preset.bitrate;
    if (file.settings.sizePerSecond) {
      // Convert KB/s to kbps (multiply by 8)
      const targetBitrateKbps = file.settings.sizePerSecond * 8;
      // Reserve 128kbps for audio
      calculatedBitrate = Math.max(100, targetBitrateKbps - 128);
    }

    const ffmpegSettings = {
      ...preset,
      calculatedBitrate,
      resolution: file.settings.resolution,
      maxWidth: file.settings.maxWidth,
      maxHeight: file.settings.maxHeight,
    };

    try {
      // Pass 1
      addLog({
        fileId: file.id,
        fileName: file.name,
        level: 'info',
        message: `Starting Pass 1 (analysis)...`,
        pass: 1,
      });

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, currentPass: 1, progress: 0 } : f
      ));

      const pass1Result = await window.electronAPI.ffmpegPass1({
        inputPath: file.path,
        settings: ffmpegSettings,
      });

      if (!pass1Result.success) {
        throw new Error(pass1Result.error || 'Pass 1 failed');
      }

      addLog({
        fileId: file.id,
        fileName: file.name,
        level: 'info',
        message: `Pass 1 complete. Starting Pass 2 (encoding)...`,
        pass: 2,
      });

      // Pass 2
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, currentPass: 2, progress: 50 } : f
      ));

      const pass2Result = await window.electronAPI.ffmpegPass2({
        inputPath: file.path,
        outputPath: file.outputPath,
        settings: ffmpegSettings,
      });

      if (!pass2Result.success) {
        throw new Error(pass2Result.error || 'Pass 2 failed');
      }

      // Success
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, status: 'complete', progress: 100, endTime: Date.now(), currentPass: null }
          : f
      ));

      addLog({
        fileId: file.id,
        fileName: file.name,
        level: 'info',
        message: `Compression complete! Output: ${file.outputPath}`,
      });

    } catch (error: any) {
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, status: 'error', error: error.message, currentPass: null }
          : f
      ));

      addLog({
        fileId: file.id,
        fileName: file.name,
        level: 'error',
        message: `Error: ${error.message}`,
      });
    }
  };

  // Remove file from list (only if not processing)
  const handleRemoveFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.status !== 'processing') {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  // Update file settings
  const handleUpdateFileSettings = (fileId: string, settings: CompressionSettings) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, settings } : f
    ));
  };

  return (
    <div className="app">
      <DropZone onFilesDrop={handleFilesDrop} />
      
      <GlobalSettings config={config} onConfigChange={updateConfig} />
      
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="content">
        {activeTab === 'files' && (
          <FileList
            files={files}
            onRemoveFile={handleRemoveFile}
            onUpdateSettings={handleUpdateFileSettings}
          />
        )}
        {activeTab === 'logs' && (
          <LogsPanel logs={logs} />
        )}
      </div>
    </div>
  );
}

export default App;
