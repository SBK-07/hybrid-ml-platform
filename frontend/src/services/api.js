import axios from 'axios';
import {
  mockGetDatasets,
  mockPreprocessDataset,
  mockTrainModels,
  mockGetExplainability,
  mockPredictPatient,
  mockUploadDataset
} from './mockData';

const API_BASE = '/api';

// Mode switcher: env flag or fallback to false for production
const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const getDatasets = async () => {
  if (IS_MOCK_MODE) return mockGetDatasets();
  try {
    const response = await axios.get(`${API_BASE}/datasets`);
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockGetDatasets();
  }
};

export const preprocessDataset = async (datasetId, nQubits = 4, applySmote = true) => {
  if (IS_MOCK_MODE) return mockPreprocessDataset(datasetId, nQubits, applySmote);
  try {
    const response = await axios.post(`${API_BASE}/preprocess`, {
      dataset_id: datasetId,
      n_qubits: nQubits,
      apply_smote: applySmote
    });
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockPreprocessDataset(datasetId, nQubits, applySmote);
  }
};

export const trainModels = async () => {
  if (IS_MOCK_MODE) return mockTrainModels();
  try {
    const response = await axios.post(`${API_BASE}/train`);
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockTrainModels();
  }
};

export const getBenchmark = async () => {
  if (IS_MOCK_MODE) return mockTrainModels();
  try {
    const response = await axios.get(`${API_BASE}/benchmark`);
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockTrainModels();
  }
};

export const getExplainability = async () => {
  if (IS_MOCK_MODE) return mockGetExplainability();
  try {
    const response = await axios.get(`${API_BASE}/explain`);
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockGetExplainability();
  }
};

export const predictPatient = async (patientData) => {
  if (IS_MOCK_MODE) return mockPredictPatient(patientData);
  try {
    const response = await axios.post(`${API_BASE}/predict`, {
      patient_data: patientData
    });
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockPredictPatient(patientData);
  }
};

export const uploadDataset = async (file) => {
  if (IS_MOCK_MODE) return mockUploadDataset(file);
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/upload_dataset`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Falling back to Mock Data.', err);
    return mockUploadDataset(file);
  }
};
