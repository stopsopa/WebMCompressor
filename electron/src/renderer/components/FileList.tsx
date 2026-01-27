import { useState, useEffect, useCallback } from 'react';
import type { VideoFile } from '../types';
import './FileList.css';

interface FileListProps {
  files: VideoFile[];
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  filePath: string;
}

function FileList({ files }: FileListProps) {
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
    // Removed window contextmenu listener as it closes the menu immediately on opening
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
      <h2 className="section-title">Queue</h2>
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
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr 
                  key={file.id} 
                  className="file-row"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
