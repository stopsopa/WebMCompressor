import './ErrorModal.css';

interface ErrorModalProps {
  fileName: string;
  error: string;
  onClose: () => void;
}

function ErrorModal({ fileName, error, onClose }: ErrorModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header error-header">
          <h2>Error Details</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="error-meta">
            <span className="label">File:</span>
            <span className="value">{fileName}</span>
          </div>
          <div className="error-message-container">
            <pre className="error-stack">{error}</pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="aws-button aws-button-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
