import axios from 'axios';
import { mockDatasets, mockCancerMetrics, mockCardioMetrics, mockPredictResult } from './mockData';

const API_BASE = '/api';

export const getDatasets = async () => {
  try {
    const res = await axios.get(`${API_BASE}/datasets`);
    const datasets = (res.data.datasets || []).map(ds => ({
      ...ds,
      id: ds.key || ds.id
    }));
    return { datasets };
  } catch (err) {
    console.warn('FastAPI backend offline. Using fallback mock datasets.', err);
    return { datasets: mockDatasets };
  }
};

export const getEdaReport = async (datasetKey) => {
  try {
    const res = await axios.get(`${API_BASE}/eda/${datasetKey}`);
    return res.data;
  } catch (err) {
    console.warn(`FastAPI backend offline. Returning mock EDA for ${datasetKey}.`, err);
    return { status: "mock", dataset_key: datasetKey };
  }
};

export const getClassicalReport = async (datasetKey) => {
  try {
    const res = await axios.get(`${API_BASE}/classical/${datasetKey}`);
    return res.data;
  } catch (err) {
    console.warn(`FastAPI backend offline. Returning mock Classical for ${datasetKey}.`, err);
    return datasetKey === 'cancer' ? mockCancerMetrics : mockCardioMetrics;
  }
};

export const getQuantumReport = async (datasetKey) => {
  try {
    const res = await axios.get(`${API_BASE}/quantum/${datasetKey}`);
    return res.data;
  } catch (err) {
    console.warn(`FastAPI backend offline. Returning mock Quantum for ${datasetKey}.`, err);
    return datasetKey === 'cancer' ? mockCancerMetrics : mockCardioMetrics;
  }
};

export const getBenchmarkReport = async (datasetKey) => {
  try {
    const res = await axios.get(`${API_BASE}/benchmark/${datasetKey}`);
    return res.data;
  } catch (err) {
    console.warn(`FastAPI backend offline. Returning mock Benchmark for ${datasetKey}.`, err);
    return { status: "mock", dataset_key: datasetKey };
  }
};

export const predictPatient = async (datasetKey, features) => {
  try {
    const res = await axios.post(`${API_BASE}/predict`, {
      dataset_key: datasetKey.toLowerCase(),
      features: features
    });
    return res.data;
  } catch (err) {
    console.warn('FastAPI backend offline. Generating fallback prediction.', err);
    return mockPredictResult(datasetKey, features);
  }
};
