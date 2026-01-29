import './ConfirmationModal.css';

interface ConfirmationModalProps {
  title: string;
  message: string;
  items?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'delete' | 'warning';
}

function ConfirmationModal({ 
  title, 
  message, 
  items, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel', 
  onConfirm, 
  onCancel,
  type = 'warning' 
}: ConfirmationModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header ${type === 'delete' ? 'delete-header' : ''}`}>
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="confirmation-message">{message}</p>
          {items && items.length > 0 && (
            <div className="confirmation-items">
              <ul>
                {items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="aws-button aws-button-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button 
            className={`aws-button ${type === 'delete' ? 'aws-button-danger' : 'aws-button-primary'}`} 
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
