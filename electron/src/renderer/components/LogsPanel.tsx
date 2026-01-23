import type { LogEntry } from '../types';
import './LogsPanel.css';

interface LogsPanelProps {
  logs: LogEntry[];
}

function LogsPanel({ logs }: LogsPanelProps) {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'info': return '#b0b0b0';
      case 'warn': return '#c0a060';
      case 'error': return '#c06060';
    }
  };

  const getLevelIcon = (level: LogEntry['level']): string => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
    }
  };

  return (
    <div className="logs-panel">
      {logs.length === 0 ? (
        <div className="logs-empty">
          <p>No logs yet. Processing logs will appear here.</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log, index) => (
            <div key={index} className="log-entry" style={{ color: getLevelColor(log.level) }}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-icon">{getLevelIcon(log.level)}</span>
              <span className="log-file">{log.fileName}</span>
              {log.pass && <span className="log-pass">Pass {log.pass}</span>}
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogsPanel;
