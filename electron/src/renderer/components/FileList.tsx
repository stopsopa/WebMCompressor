import { useState, useEffect, useCallback } from 'react';
import type { VideoFile } from '../types';
import './FileList.css';

interface FileListProps {
  files: VideoFile[];
  parallelProcessing: number;
  onParallelChange: (count: number) => void;
  onEdit: (file: VideoFile) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  filePath: string;
}

function FileList({ files, parallelProcessing, onParallelChange, onEdit }: FileListProps) {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    filePath: '',
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, filePath: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to window
    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      filePath,
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
    if (menu.filePath) {
      window.electronAPI.revealVideo(menu.filePath);
    }
    closeMenu();
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        </div>
      </div>

      <div className="settings-content table-content">
        <div className="table-container">
          {files.length === 0 ? (
            <div className="empty-list-msg">No files in queue. Drop files above to add them.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Dimensions</th>
                  <th>FPS</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const isEditable = file.status === 'queued' || file.status === 'error';
                  return (
                    <tr 
                      key={file.id} 
                      className={`file-row ${file.isEditing ? 'is-editing' : ''}`}
                      onContextMenu={(e) => handleContextMenu(e, file.path)}
                    >
                      <td>{file.name}</td>
                      <td>{file.width ? `${file.width}x${file.height}` : '-'}</td>
                      <td>{file.fps ? `${file.fps} fps` : '-'}</td>
                      <td>{file.durationMs ? formatDuration(file.durationMs) : '-'}</td>
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
                        <button 
                          className="aws-button aws-button-secondary edit-btn"
                          onClick={() => onEdit(file)}
                          disabled={!isEditable || file.isEditing}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        </div>
      )}
    </div>
  );
}

export default FileList;
