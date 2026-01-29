import { useState, useEffect, useCallback, useMemo } from 'react';
import type { VideoFile } from '../types';
import { COLUMN_WIDTHS } from '../columnWidths';
import scaleWandH from '../../tools/scaleWandH';
import ConfirmationModal from './ConfirmationModal';
import './FileList.css';

interface FileListProps {
  files: VideoFile[];
  parallelProcessing: number;
  onParallelChange: (count: number) => void;
  onEdit: (file: VideoFile) => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onRemoveMultiple: (ids: string[]) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onShowCommand: (command: string) => void;
  onShowError: (name: string, error: string) => void;
  isConverting: boolean;
  onStartConverting: () => void;
  onModalLock: (locked: boolean) => void;
}

interface ContextMenuState {
  file: VideoFile | null;
  visible: boolean;
  x: number;
  y: number;
}

function FileList({ files, parallelProcessing, onParallelChange, onEdit, onClear, onRemove, onRemoveMultiple, onReorder, onShowCommand, onShowError, isConverting, onStartConverting, onModalLock }: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [hoveredUpscaleRowId, setHoveredUpscaleRowId] = useState<string | null>(null);
  
  useEffect(() => {
    onModalLock(!!singleDeleteId || showBulkDeleteModal);
  }, [singleDeleteId, showBulkDeleteModal, onModalLock]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (files[index].status === 'processing') {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    // Standard DnD feedback
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Create a ghost image if needed, or just let the default handle it
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    setHoveredIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };
  const [menu, setMenu] = useState<ContextMenuState>({
    file: null,
    visible: false,
    x: 0,
    y: 0,
  });

  const closeMenu = useCallback(() => {
    setMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: VideoFile) => {
    e.preventDefault();
    e.stopPropagation();
    
    setMenu({
      file,
      visible: true,
      x: e.clientX + 2,
      y: e.clientY + 2,
    });
  }, []);


  useEffect(() => {
    const handleClick = () => closeMenu();
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [closeMenu]);

  const handleRevealInput = () => {
    if (menu.file) {
      window.electronAPI.revealVideo(menu.file.path);
    }
    closeMenu();
  };

  const handleRevealOutput = () => {
    if (menu.file && menu.file.outputPath) {
      window.electronAPI.revealVideo(menu.file.outputPath);
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

  const handleToggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    const removableFiles = files.filter(f => f.status !== 'processing');
    setCheckedIds(prev => {
      if (prev.size === 0) {
        return new Set(removableFiles.map(f => f.id));
      }
      const next = new Set<string>();
      removableFiles.forEach(f => {
        if (!prev.has(f.id)) {
          next.add(f.id);
        }
      });
      return next;
    });
  };

  const checkedFiles = useMemo(() => {
    return files.filter(f => checkedIds.has(f.id));
  }, [files, checkedIds]);

  const handleBulkDelete = () => {
    onRemoveMultiple(Array.from(checkedIds));
    setCheckedIds(new Set());
    setShowBulkDeleteModal(false);
  };

  const handleSingleDelete = () => {
    if (singleDeleteId) {
      onRemove(singleDeleteId);
      setCheckedIds(prev => {
        const next = new Set(prev);
        next.delete(singleDeleteId);
        return next;
      });
      setSingleDeleteId(null);
    }
  };

  const handleVerticalTooltipEnter = (e: React.MouseEvent<HTMLElement>) => {
    const popover = e.currentTarget.querySelector('.aws-tooltip') as any;
    if (!popover) return;
    
    // Reset classes and show to measure
    popover.classList.remove('tooltip-top');
    popover.showPopover();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const offset = 10;
    
    // Check if it overflows the bottom
    const overflowsBottom = rect.bottom + offset + popoverRect.height > window.innerHeight;
    
    if (overflowsBottom) {
      popover.style.top = `${rect.top - offset - popoverRect.height}px`;
      popover.classList.add('tooltip-top');
    } else {
      popover.style.top = `${rect.bottom + offset}px`;
    }
    
    popover.style.left = `${rect.left + rect.width / 2}px`;
  };

  return (
    <div className="file-list-section card">
      <div className="settings-header">
        <h2 className="section-title">Queue</h2>
        <div className="parallelism-control">
          {checkedIds.size > 0 && (
            <button 
              className="aws-button aws-button-danger bulk-delete-btn"
              onClick={() => setShowBulkDeleteModal(true)}
            >
              Bulk Delete ({checkedIds.size})
            </button>
          )}
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
            disabled={isConverting || !!singleDeleteId || showBulkDeleteModal || !files.some(f => f.status === 'queued' && !f.isEditing)}
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
                    <th style={{ width: COLUMN_WIDTHS.reorder }}></th>
                    <th style={{ width: COLUMN_WIDTHS.checkbox }}>
                      <button 
                        className="toggle-all-btn has-tooltip" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAll();
                        }}
                        onMouseEnter={(e) => {
                          const popover = e.currentTarget.querySelector('.aws-tooltip') as any;
                          if (!popover) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          popover.style.top = `${rect.top + rect.height / 2}px`;
                          popover.style.left = `${rect.right + 10}px`;
                          popover.showPopover();
                        }}
                        onMouseLeave={(e) => (e.currentTarget.querySelector('.aws-tooltip') as any)?.hidePopover()}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H6c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1zM7 8h10v2H7zm0 3h10v2H7zm0 3h7v2H7z"/>
                        </svg>
                        <div popover="manual" className="aws-tooltip tooltip-right">
                          Toggle all checkboxes
                        </div>
                      </button>
                    </th>
                    <th>File Name</th>
                    <th style={{ width: COLUMN_WIDTHS.fps }}>FPS</th>
                    <th style={{ width: COLUMN_WIDTHS.duration }}>Duration</th>
                    <th style={{ width: COLUMN_WIDTHS.size }}>Size</th>
                    <th style={{ width: COLUMN_WIDTHS.dimensions }}>Dimensions</th>
                    <th style={{ width: COLUMN_WIDTHS.scale }}>Scale</th>
                    <th 
                      style={{ width: COLUMN_WIDTHS.pass1 }} 
                      className="has-tooltip"
                      onMouseEnter={handleVerticalTooltipEnter}
                      onMouseLeave={(e) => (e.currentTarget.querySelector('.aws-tooltip') as any)?.hidePopover()}
                    >
                      <span className="header-label">Pass 1</span>
                      <div popover="manual" className="aws-tooltip">
                        First pass: Analysis phase. Shows 'scanning' when active and duration when finished.
                      </div>
                    </th>
                    <th 
                      style={{ width: COLUMN_WIDTHS.pass2 }} 
                      className="has-tooltip"
                      onMouseEnter={handleVerticalTooltipEnter}
                      onMouseLeave={(e) => (e.currentTarget.querySelector('.aws-tooltip') as any)?.hidePopover()}
                    >
                      <span className="header-label">Pass 2</span>
                      <div popover="manual" className="aws-tooltip">
                        Second pass: Encoding phase. % - Progress, T - Est. Total time, R - Est. Remaining time.
                      </div>
                    </th>
                    <th style={{ width: COLUMN_WIDTHS.status }}>Status</th>
                    <th style={{ width: COLUMN_WIDTHS.actions }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => {
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
                        className={`file-row ${file.isEditing ? 'is-editing' : ''} ${file.status === 'error' ? 'error-row' : ''} ${draggedIndex === index ? 'is-dragging' : ''} ${hoveredIndex === index ? 'is-hovered' : ''}`}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <td 
                          className="reorder-cell"
                          draggable={file.status !== 'processing'}
                          onDragStart={(e) => handleDragStart(e, index)}
                        >
                          <div className="reorder-handle">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                              <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </div>
                        </td>
                        <td className="checkbox-cell">
                          <input 
                            type="checkbox" 
                            checked={checkedIds.has(file.id)}
                            onChange={() => handleToggleCheck(file.id)}
                            disabled={file.status === 'processing'}
                            className="row-checkbox"
                          />
                        </td>
                        <td className="file-name-cell" title={file.name}>{file.name}</td>
                        <td>{file.fps ? `${file.fps} fps` : '-'}</td>
                        <td>{file.durationMs ? formatDuration(file.durationMs) : '-'}</td>
                        <td>{file.size ? formatBytes(file.size) : '-'}</td>
                        <td className="dimensions-cell">
                          {file.width ? (
                            <>
                              <span 
                                className={`${highlightW ? 'highlight has-tooltip' : ''}`}
                                onMouseEnter={(e) => {
                                  if (!highlightW) return;
                                  setHoveredUpscaleRowId(file.id);
                                  handleVerticalTooltipEnter(e);
                                }}
                                onMouseLeave={(e) => {
                                  if (!highlightW) return;
                                  setHoveredUpscaleRowId(null);
                                  (e.currentTarget.querySelector('.aws-tooltip') as any)?.hidePopover();
                                }}
                              >
                                w: {file.width}
                                {highlightW && (
                                  <div popover="manual" className="aws-tooltip">
                                    This width is being upscaled. The settings determined at the moment of drag and drop were higher than the original width of the video. It can be fixed with the <strong>edit</strong> button on the right side of this row.
                                  </div>
                                )}
                              </span>
                              {' '}
                              <span 
                                className={`${highlightH ? 'highlight has-tooltip' : ''}`}
                                onMouseEnter={(e) => {
                                  if (!highlightH) return;
                                  setHoveredUpscaleRowId(file.id);
                                  handleVerticalTooltipEnter(e);
                                }}
                                onMouseLeave={(e) => {
                                  if (!highlightH) return;
                                  setHoveredUpscaleRowId(null);
                                  (e.currentTarget.querySelector('.aws-tooltip') as any)?.hidePopover();
                                }}
                              >
                                h: {file.height}
                                {highlightH && (
                                  <div popover="manual" className="aws-tooltip">
                                    This height is being upscaled. The settings determined at the moment of drag and drop were higher than the original height of the video. It can be fixed with the <strong>edit</strong> button on the right side of this row.
                                  </div>
                                )}
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
                            file.pass1Duration ? file.pass1Duration : '-'
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
                          {isEditable && (
                            <div className="action-buttons">
                              <button 
                                className={`aws-button aws-button-secondary edit-btn ${hoveredUpscaleRowId === file.id ? 'pulse-highlight' : ''}`}
                                onClick={() => onEdit(file)}
                                disabled={file.isEditing}
                              >
                                Edit
                              </button>
                              {file.status === 'error' && (
                                <button 
                                  className="aws-button error-btn"
                                  onClick={() => onShowError(file.name, file.error || 'Unknown error')}
                                >
                                  Error
                                </button>
                              )}
                                <button 
                                  className="aws-button delete-btn"
                                  onClick={() => setSingleDeleteId(file.id)}
                                  disabled={file.status === 'processing'}
                                  title="Remove from queue"
                                >
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                  </svg>
                                </button>
                            </div>
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
          className="aws-popover-menu"
          style={{ 
            minWidth: '180px',
            top: menu.y,
            left: menu.x,
            opacity: 1,
            display: 'block',
            position: 'fixed',
            transform: 'none',
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={handleRevealInput}>
            Reveal Input in Finder
          </div>
          {menu.file?.status === 'complete' && (
            <div className="menu-item" onClick={handleRevealOutput}>
              Reveal Output in Finder
            </div>
          )}
          <div className="menu-item" onClick={handleCopyCommand}>
            Copy FFMPEG Command
          </div>
        </div>
      )}

      {singleDeleteId && (
        <ConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to remove "${files.find(f => f.id === singleDeleteId)?.name}" from the queue?`}
          confirmLabel="Delete"
          type="delete"
          onConfirm={handleSingleDelete}
          onCancel={() => setSingleDeleteId(null)}
        />
      )}

      {showBulkDeleteModal && (
        <ConfirmationModal
          title="Confirm Bulk Deletion"
          message={`Are you sure you want to remove the following ${checkedIds.size} files from the queue?`}
          items={checkedFiles.map(f => f.name)}
          confirmLabel="Delete All"
          type="delete"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}
    </div>
  );
}

export default FileList;
