import React from 'react';
import { Plus, Check, Eye } from 'lucide-react';

export default function DatasetsHub({
  datasetsList,
  activeDataset,
  onSelectDataset,
  onOpenPreviewModal,
  onOpenUploadModal
}) {
  return (
    <section className="hub-section active">
      <div className="section-header">
        <div>
          <h1>Tabular Datasets Repository</h1>
          <p className="subtitle">Manage existing biomedical datasets or upload custom tabular CSV data for quantum-classical training.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenUploadModal}>
          <Plus size={16} /> Upload New CSV Dataset
        </button>
      </div>

      <div className="grid-3">
        {datasetsList.map(ds => {
          const isActive = ds.id === activeDataset;
          return (
            <div key={ds.id} className={`card dataset-card-item ${isActive ? 'active-ds' : ''}`}>
              <div>
                <div className="dataset-header">
                  <span className="dataset-title">{ds.name}</span>
                  <span className="dataset-badge">{ds.samples} rows</span>
                </div>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>
                  Target Column: <strong>{ds.target_column}</strong>
                </p>
                <div className="dataset-meta">
                  <div className="meta-item">Features: <span>{ds.features}</span></div>
                  <div className="meta-item">Format: <span>Tabular CSV</span></div>
                </div>
              </div>

              <div className="dataset-actions" style={{ marginTop: '16px' }}>
                <button
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onSelectDataset(ds.id)}
                >
                  {isActive ? (
                    <><Check size={14} /> Active Dataset</>
                  ) : (
                    'Set Active'
                  )}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onOpenPreviewModal(ds.id)}
                >
                  <Eye size={14} /> Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
