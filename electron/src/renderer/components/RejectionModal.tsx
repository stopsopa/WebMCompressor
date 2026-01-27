import './RejectionModal.css';

interface RejectedFile {
  path: string;
  error: string;
}

interface RejectionModalProps {
  files: RejectedFile[];
  onClose: () => void;
}

function RejectionModal({ files, onClose }: RejectionModalProps) {
  if (files.length === 0) return null;

  const handleReveal = (path: string) => {
    window.electronAPI.revealVideo(path);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <h2 className="section-title" style={{ color: 'var(--aws-red)' }}>Unsupported Files Rejected</h2>
        <p>The following files were rejected because they are not valid videos or could not be processed:</p>
        <ul className="rejection-list">
          {files.map((file, index) => (
            <li key={index} className="rejection-item">
              <div className="rejection-header">
                <span className="rejection-path" title={file.path}>{file.path}</span>
                <button 
                  className="aws-button aws-button-secondary reveal-button"
                  onClick={() => handleReveal(file.path)}
                  title="Reveal in Finder"
                >
                  Reveal
                </button>
              </div>
              <div className="rejection-error">
                {file.error}
              </div>
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <button className="aws-button aws-button-primary" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectionModal;
