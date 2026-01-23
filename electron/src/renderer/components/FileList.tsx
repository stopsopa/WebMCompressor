import { useState } from 'react';
import type { VideoFile, CompressionSettings } from '../types';
import SettingsModal from './SettingsModal';
import './FileList.css';

interface FileListProps {
  files: VideoFile[];
  onRemoveFile: (fileId: string) => void;
  onUpdateSettings: (fileId: string, settings: CompressionSettings) => void;
}

function FileList({ files, onRemoveFile, onUpdateSettings }: FileListProps) {
  const [editingFile, setEditingFile] = useState<VideoFile | null>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: VideoFile['status']): string => {
    switch (status) {
      case 'validating': return '🔍';
      case 'queued': return '⏳';
      case 'processing': return '⚙️';
      case 'complete': return '✓';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: VideoFile['status']): string => {
    switch (status) {
      case 'validating': return '#808080';
      case 'queued': return '#808080';
      case 'processing': return '#9999aa';
      case 'complete': return '#6b6b6b';
      case 'error': return '#8a8a8a';
    }
  };

  const canRemove = (file: VideoFile): boolean => {
    return file.status !== 'processing';
  };

  return (
    <div className="file-list-container">
      {files.length === 0 ? (
        <div className="empty-state">
          <p>No files added yet. Drop videos above to get started.</p>
        </div>
      ) : (
        <div className="file-list">
          <div className="file-list-header">
            <div className="col-filename">Filename</div>
            <div className="col-duration">Duration</div>
            <div className="col-size">Size</div>
            <div className="col-quality">Quality</div>
            <div className="col-status">Status</div>
            <div className="col-progress">Progress</div>
            <div className="col-actions">Actions</div>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              className="file-item"
              onClick={() => setEditingFile(file)}
              style={{ cursor: 'pointer' }}
            >
              <div className="col-filename" title={file.name}>
                {file.name}
              </div>
              
              <div className="col-duration">
                {file.duration > 0 ? formatDuration(file.duration) : '-'}
              </div>
              
              <div className="col-size">
                {file.fileSize > 0 ? formatFileSize(file.fileSize) : '-'}
              </div>
              
              <div className="col-quality">
                {file.settings.quality}
              </div>
              
              <div className="col-status" style={{ color: getStatusColor(file.status) }}>
                <span className="status-icon">{getStatusIcon(file.status)}</span>
                {file.status}
                {file.currentPass && ` (Pass ${file.currentPass})`}
              </div>
              
              <div className="col-progress">
                {file.status === 'processing' || file.status === 'complete' ? (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
              
              <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                {canRemove(file) && (
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveFile(file.id)}
                    title="Remove from list"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {file.error && (
                <div className="file-error">
                  Error: {file.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingFile && (
        <SettingsModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSave={(settings) => {
            onUpdateSettings(editingFile.id, settings);
            setEditingFile(null);
          }}
        />
      )}
    </div>
  );
}

export default FileList;
