import React, { useEffect, useRef, useState } from 'react';
import './CommandModal.css';

interface CommandModalProps {
  command: string;
  onClose: () => void;
}

const CommandModal: React.FC<CommandModalProps> = ({ command, onClose }) => {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (editorRef.current) {
      const setVal = () => {
        editorRef.current.value = command;
        editorRef.current.setAttribute('value', command);
      };
      setVal();
      // Short delay ensures the web component is ready
      const timer = setTimeout(setVal, 50);
      return () => clearTimeout(timer);
    }
  }, [command]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content command-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>FFMPEG Command</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="command-desc">
            You can run this command manually in your terminal. It includes absolute paths to the bundled binaries and files.
          </p>
          <div className="command-editor-wrapper">
            {/* @ts-ignore */}
            <ace-editor 
              ref={editorRef}
              lang="sh" 
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className={`aws-button ${copied ? 'aws-button-success' : 'aws-button-primary'}`} 
            onClick={handleCopy}
            style={{ minWidth: '150px' }}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button className="aws-button aws-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandModal;
