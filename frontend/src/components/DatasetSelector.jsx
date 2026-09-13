import React from 'react';

export default function DatasetSelector({ activeDataset, setActiveDataset, datasetsList = [] }) {
  return (
    <div className="dataset-bar">
      <label htmlFor="datasetSelect">Select Medical Research Dataset:</label>
      <select
        id="datasetSelect"
        className="dataset-select"
        value={activeDataset}
        onChange={(e) => setActiveDataset(e.target.value)}
      >
        <option value="cancer">Breast Cancer Wisconsin Diagnostic (WDBC) - 30 Features</option>
        <option value="cardiovascular">UCI Heart Disease - 13 Clinical Attributes</option>
      </select>
    </div>
  );
}
