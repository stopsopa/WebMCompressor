import { useState, useEffect, useCallback } from 'react';
import type { VideoFile } from '../types';
import { COLUMN_WIDTHS } from '../columnWidths';
import scaleWandH from '../../tools/scaleWandH';
import './FileList.css';

interface FileListProps {
  files: VideoFile[];
  parallelProcessing: number;
  onParallelChange: (count: number) => void;
  onEdit: (file: VideoFile) => void;
  onClear: () => void;
  onShowCommand: (command: string) => void;
  isConverting: boolean;
  onStartConverting: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: VideoFile | null;
}

function FileList({ files, parallelProcessing, onParallelChange, onEdit, onClear, onShowCommand, isConverting, onStartConverting }: FileListProps) {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null,
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, file: VideoFile) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to window
    setMenu({
      visible: true,
      x: e.clientX + 2,
      y: e.clientY + 2,
      file,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClick = () => closeMenu();
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [closeMenu]);

  const handleReveal = () => {
    if (menu.file) {
      window.electronAPI.revealVideo(menu.file.path);
    }
    closeMenu();
  };

  const handleCopyCommand = async () => {
    if (menu.file) {
      const command = await window.electronAPI.getFFMPEGCommand({
        sourceFile: menu.file.path,
        settings: menu.file.settings,
        metadata: {
          width: menu.file.width,
          height: menu.file.height,
          fps: menu.file.fps,
        }
      });
      onShowCommand(command);
    }
    closeMenu();
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allProcessed = files.length > 0 && files.every(f => f.status === 'complete' || f.status === 'error');

  return (
    <div className="file-list-section card">
      <div className="settings-header">
        <h2 className="section-title">Queue</h2>
        <div className="parallelism-control">
          <span className="control-label">Parallel Jobs:</span>
          <div className="radio-group">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <label key={n} className="radio-button-card">
                <input 
                  type="radio" 
                  name="parallelJobs" 
                  value={n} 
                  checked={parallelProcessing === n}
                  onChange={() => onParallelChange(n)}
                />
                <span className="radio-tile">{n}</span>
              </label>
            ))}
          </div>
          <button 
            className={`aws-button start-btn ${isConverting ? 'aws-button-secondary' : 'aws-button-primary'}`}
            onClick={onStartConverting}
            disabled={isConverting || !files.some(f => f.status === 'queued' && !f.isEditing)}
            style={{ marginLeft: '16px' }}
          >
            {isConverting ? 'Converting...' : 'Start Converting'}
          </button>
        </div>
      </div>

      <div className="settings-content table-content">
        <div className="table-container">
          {files.length === 0 ? (
            <div className="empty-list-msg">No files in queue. Drop files above to add them.</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th style={{ width: COLUMN_WIDTHS.fps }}>FPS</th>
                    <th style={{ width: COLUMN_WIDTHS.duration }}>Duration</th>
                    <th style={{ width: COLUMN_WIDTHS.size }}>Size</th>
                    <th style={{ width: COLUMN_WIDTHS.status }}>Status</th>
                    <th style={{ width: COLUMN_WIDTHS.dimensions }}>Dimensions</th>
                    <th style={{ width: COLUMN_WIDTHS.scale }}>Scale</th>
                    <th style={{ width: COLUMN_WIDTHS.pass1 }} title="First pass: Analysis phase. Shows 'scanning' when active and duration when finished.">Pass 1</th>
                    <th style={{ width: COLUMN_WIDTHS.pass2 }} title="Second pass: Encoding phase. % - Progress, T - Estimated Total time, R - Estimated Remaining time.">Pass 2</th>
                    <th style={{ width: COLUMN_WIDTHS.actions }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const isEditable = file.status === 'queued' || file.status === 'error';

                    let highlightW = false;
                    let highlightH = false;



                    if (file.settings.scale && (file.width || file.height)) {
                      try {
                        const scaled = scaleWandH(
                          { width: file.width, height: file.height },
                          { 
                            width: file.settings.videoWidth ?? undefined, 
                            height: file.settings.videoHeight ?? undefined 
                          } as any
                        );
                        
                        if (file.settings.videoWidth && scaled.width > file.width) {
                          highlightW = true;
                        }
                        if (file.settings.videoHeight && scaled.height > file.height) {
                          highlightH = true;
                        }
                      } catch (e) {
                         // ignore scaling errors for highlighting
                      }
                    }

                    return (
                      <tr 
                        key={file.id} 
                        className={`file-row ${file.isEditing ? 'is-editing' : ''}`}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                      >
                        <td className="file-name-cell" title={file.name}>{file.name}</td>
                        <td>{file.fps ? `${file.fps} fps` : '-'}</td>
                        <td>{file.durationMs ? formatDuration(file.durationMs) : '-'}</td>
                        <td>{file.size ? formatBytes(file.size) : '-'}</td>
                        <td>
                          <span className={`status-badge status-${file.status}`}>
                            {file.status}
                          </span>
                          {file.isEditing && (
                            <span className="status-badge status-editing">
                              Editing...
                            </span>
                          )}
                        </td>
                        <td>
                          {file.width ? (
                            <>
                              <span 
                                className={highlightW ? 'highlight' : ''} 
                                title={highlightW ? "This dimension is being upscaled." : undefined}
                              >
                                w: {file.width}
                              </span>
                              {' '}
                              <span 
                                className={highlightH ? 'highlight' : ''} 
                                title={highlightH ? "This dimension is being upscaled." : undefined}
                              >
                                h: {file.height}
                              </span>
                            </>
                          ) : '-'}
                        </td>
                        <td>
                          {file.settings.scale ? (
                            <>
                              {file.settings.videoWidth && `w:${file.settings.videoWidth}`}
                              {' '}
                              {file.settings.videoHeight && `h:${file.settings.videoHeight}`}
                            </>
                          ) : (
                            'original'
                          )}
                        </td>
                        <td>
                          {file.status === 'processing' && file.currentPass === 1 ? (
                            <div className="progress-container pass1-progress">
                              <div className="progress-bar indeterminate"></div>
                              <span className="progress-text" style={{ zIndex: 2, color: '#16191f', textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
                                scanning...
                              </span>
                            </div>
                          ) : (
                            file.pass1Duration ? `1st: ${file.pass1Duration}` : '-'
                          )}
                        </td>
                        <td>
                          {file.status === 'processing' && file.currentPass === 2 ? (() => {
                            const text = file.pass2ProgressData ? (
                              `${file.pass2ProgressData.progressPercentNum}% | T:${file.pass2ProgressData.estimatedTotalTimeHuman} | R:${file.pass2ProgressData.estimatedRemainingTimeHuman}`
                            ) : 'starting...';
                            const progress = file.pass2ProgressData?.progressPercentNum ?? 0;
                            
                            return (
                              <div className="progress-container pass2-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                                <span className="progress-text progress-text-background">{text}</span>
                                <span 
                                  className="progress-text progress-text-foreground"
                                  style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
                                >
                                  {text}
                                </span>
                              </div>
                            );
                          })() : (
                            file.pass2Duration ? `Total: ${file.pass2Duration}` : '-'
                          )}
                        </td>
                        <td>
                          {isEditable && (
                            <button 
                              className="aws-button aws-button-secondary edit-btn"
                              onClick={() => onEdit(file)}
                              disabled={file.isEditing}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {allProcessed && (
                <div className="list-footer">
                  <button 
                    className="aws-button aws-button-secondary clear-btn"
                    onClick={onClear}
                  >
                    Clear Queue
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {menu.visible && (
        <div 
          className="context-menu" 
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleReveal}>
            Reveal in Finder
          </div>
          <div className="context-menu-item" onClick={handleCopyCommand}>
            Copy FFMPEG Command
          </div>
        </div>
      )}
    </div>
  );
}

export default FileList;
