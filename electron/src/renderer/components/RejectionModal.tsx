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

  const total = files.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="status-icon-error">⚠</span>
            Validation errors ({total})
          </h2>
          <button className="close-x-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body rejection-modal-body">
          <div className="aws-alert-error">
            <div className="alert-content">
              <strong>The following files could not be added to the queue.</strong>
              <p>These files either aren't valid video formats or FFprobe was unable to extract necessary metadata (duration, resolution, etc.).</p>
            </div>
          </div>

          <div className="rejection-scroll-area">
            {files.map((file, index) => (
              <div key={index} className="rejection-entry">
                <div className="entry-main">
                  <span className="entry-path" title={file.path}>{file.path}</span>
                  <button 
                    className="aws-button aws-button-secondary reveal-small-btn"
                    onClick={() => handleReveal(file.path)}
                  >
                    Reveal
                  </button>
                </div>
                <div className="entry-error-msg">
                  {file.error}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="aws-button aws-button-primary" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectionModal;
