import React from 'react';

export default function DataPreviewModal({ datasetId, previewData, onClose }) {
  if (!datasetId) return null;

  const headers = previewData && previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-large">
        <div className="modal-header">
          <h3>Dataset Preview: {datasetId}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewData && previewData.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map(h => <td key={h}>{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
