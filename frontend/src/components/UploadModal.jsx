import React, { useState, useRef } from 'react';
import { FileText, Check } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please select a valid tabular .csv file.');
      return;
    }

    setUploading(true);
    setStatusMsg(`Uploading and parsing ${file.name}...`);

    try {
      await onUploadSuccess(file);
      setStatusMsg(`Successfully uploaded ${file.name}!`);
      setTimeout(() => {
        setUploading(false);
        setStatusMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Error uploading dataset.');
      setUploading(false);
      setStatusMsg('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Upload New Tabular CSV Dataset</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Upload a standard tabular CSV dataset. Ensure the last column contains target binary classification labels (0 or 1).</p>
          
          <div
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <FileText size={44} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <p>Drag & drop your CSV file here or <strong>browse</strong></p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
            />
          </div>

          {statusMsg && (
            <div className="upload-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Check size={16} /> {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
