import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ChevronDown, ChevronUp, UserCheck, ShieldAlert, BookOpen, Sliders,
  Stethoscope, AlertCircle, Compass, Loader2, Bot, ArrowRight, Cpu, Play,
  Upload, FileText, Image as ImageIcon, CheckCircle, Printer, Eye, Sparkles, HelpCircle
} from 'lucide-react';
import { predictPatient, predictMultimodalPatient } from '../services/api';
import CardActionMenu from '../components/CardActionMenu';

export default function LivePatientInference() {
  const navigate = useNavigate();

  // Presets & Active Dataset
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('skin_stage0_actinic');
  const activeDataset = 'cancer';

  // Flexible Input Modality State: 'multimodal' | 'image' | 'form' | 'csv'
  const [inputMode, setInputMode] = useState('multimodal');

  // Input Data States
  const [features, setFeatures] = useState({});
  const [patientAge, setPatientAge] = useState(52);
  const [anatomicalSite, setAnatomicalSite] = useState('face_scalp');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('/static/samples/actinic_keratosis_stage0.svg');
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');

  // Dual View Mode: 'patient' (Non-Tech Layman) | 'clinical' (Technical)
  const [viewMode, setViewMode] = useState('patient');

  // Explainability & Modal States
  const [showGradCam, setShowGradCam] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Prediction & Loading States
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Accordion Toggles
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [showAdvancedResults, setShowAdvancedResults] = useState(false);
  const [showExplainability, setShowExplainability] = useState(true);
  const [showCounterfactual, setShowCounterfactual] = useState(true);

  // Counterfactual interactive simulation state
  const [simulatedDeltas, setSimulatedDeltas] = useState({});
  const [simulatedRisk, setSimulatedRisk] = useState(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/patient-presets');
      const data = await response.json();
      const list = data.presets || [];
      setPresets(list);
      if (list.length > 0) {
        const defaultPreset = list.find(p => p.id === 'skin_stage0_actinic') || list[0];
        setSelectedPresetId(defaultPreset.id);
        loadPresetData(defaultPreset);
      }
    } catch (err) {
      console.error('Error loading patient presets:', err);
    }
  };

  const loadPresetData = (preset) => {
    const featMap = preset.cancer_features || preset.cardio_features || {};
    setFeatures(featMap);
    if (featMap.age) setPatientAge(featMap.age);
    if (featMap.anatomical_site) setAnatomicalSite(featMap.anatomical_site);

    if (preset.sample_image_url) {
      setImagePreview(preset.sample_image_url);
      setImageFile(null);
    }
    setCsvFile(null);
    setCsvFileName('');
    setPredictionResult(null);
    setSimulatedDeltas({});
    setSimulatedRisk(null);
  };

  const handlePresetChange = (e) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      loadPresetData(preset);
    }
  };

  const handleInputChange = (featureName, value) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: parseFloat(value) || 0
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setCsvFileName(file.name);
    }
  };

  const handleRunInference = async (e) => {
    e.preventDefault();
    setPredictionResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (csvFile) {
        formData.append('csv_file', csvFile);
      }
      formData.append('age', patientAge);
      formData.append('anatomical_site', anatomicalSite);
      formData.append('dataset_key', activeDataset);
      formData.append('features_json', JSON.stringify(features));

      const res = await predictMultimodalPatient(formData);
      setPredictionResult(res);

      if (res?.early_detection?.probability !== undefined) {
        setSimulatedRisk(res.early_detection.probability);
        setSimulatedDeltas({});
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCounterfactualSlider = (featureName, originalVal, recommendedVal, sliderPercent) => {
    const currentDeltaPct = (sliderPercent / 100);
    const currentVal = originalVal + (recommendedVal - originalVal) * currentDeltaPct;

    setSimulatedDeltas(prev => ({
      ...prev,
      [featureName]: {
        percentAchieved: sliderPercent,
        currentVal: currentVal
      }
    }));

    if (predictionResult?.predictions?.hybrid_consensus_ensemble) {
      const origRisk = predictionResult.predictions.hybrid_consensus_ensemble.probability;
      const targetRisk = predictionResult.explainability?.counterfactual?.target_risk_probability || (origRisk * 0.3);
      const totalDrivers = predictionResult.explainability?.counterfactual?.key_interventions?.length || 1;

      const currentDeltas = { ...simulatedDeltas, [featureName]: { percentAchieved: sliderPercent } };
      let sumPct = 0;
      Object.values(currentDeltas).forEach(d => {
        sumPct += (d.percentAchieved || 0);
      });
      const avgProgress = sumPct / (totalDrivers * 100);
      const newSimRisk = origRisk - (origRisk - targetRisk) * Math.min(1.0, Math.max(0.0, avgProgress));
      setSimulatedRisk(parseFloat(newSimRisk.toFixed(4)));
    }
  };

  const handleConsultQuddos = () => {
    if (!predictionResult) return;

    const artifact = {
      title: `Multimodal Patient Case Study (${selectedPreset?.name || 'Custom Upload'})`,
      category: 'Early Disease Detection & Multimodal XAI',
      data: {
        preset_name: selectedPreset?.name,
        dataset: activeDataset,
        patient_age: patientAge,
        anatomical_site: anatomicalSite,
        early_detection: predictionResult.early_detection,
        age_factor: predictionResult.age_factor,
        gradcam: predictionResult.gradcam_explainability,
        features: features,
        predictions: predictionResult.predictions,
        uncertainty: predictionResult.uncertainty,
        explainability: predictionResult.explainability,
        bloch_coordinates: predictionResult.bloch_coordinates
      },
      metadata: {
        domain: activeDataset,
        hybrid_risk: predictionResult.early_detection?.probability || predictionResult.predictions?.hybrid_consensus_ensemble?.probability,
        stage_code: predictionResult.early_detection?.stage_code
      },
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('quddos_artifacts') || '[]');
    const filtered = existing.filter(a => a.title !== artifact.title);
    filtered.unshift(artifact);
    localStorage.setItem('quddos_artifacts', JSON.stringify(filtered));

    navigate('/quddos');
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const predictions = predictionResult?.predictions;
  const uncertainty = predictionResult?.uncertainty;
  const explainability = predictionResult?.explainability;
  const blochCoords = predictionResult?.bloch_coordinates;
  const counterfactual = explainability?.counterfactual;
  const earlyDet = predictionResult?.early_detection;
  const ageFactor = predictionResult?.age_factor;
  const gradCam = predictionResult?.gradcam_explainability;

  const testingImagesGallery = [
    { name: "Stage 0 (Age 45)", file: "stage0_actinic_keratosis_age45.svg", age: 45, site: "face_scalp", stage: "Stage 0 Pre-Cancerous" },
    { name: "Stage 0 (Age 58)", file: "stage0_actinic_keratosis_age58.svg", age: 58, site: "face_scalp", stage: "Stage 0 Pre-Cancerous" },
    { name: "Stage 0 (Age 72)", file: "stage0_actinic_keratosis_age72.svg", age: 72, site: "upper_extremity", stage: "Stage 0 Pre-Cancerous" },
    { name: "Stage I (Age 38)", file: "stage1_early_melanoma_age38.svg", age: 38, site: "back_trunk", stage: "Stage I Early Malignant" },
    { name: "Stage I (Age 61)", file: "stage1_early_melanoma_age61.svg", age: 61, site: "upper_extremity", stage: "Stage I Early Malignant" },
    { name: "Stage I (Age 75)", file: "stage1_early_melanoma_age75.svg", age: 75, site: "lower_extremity", stage: "Stage I Early Malignant" },
    { name: "Stage II (Age 52)", file: "stage2_invasive_melanoma_age52.svg", age: 52, site: "torso", stage: "Stage II+ Invasive" },
    { name: "Stage II (Age 68)", file: "stage2_invasive_melanoma_age68.svg", age: 68, site: "back_trunk", stage: "Stage II+ Invasive" },
    { name: "Stage II (Age 82)", file: "stage2_invasive_melanoma_age82.svg", age: 82, site: "face_scalp", stage: "Stage II+ Invasive" },
    { name: "Benign (Age 24)", file: "benign_nevus_age24.svg", age: 24, site: "upper_extremity", stage: "Benign / Healthy" },
    { name: "Benign (Age 35)", file: "benign_nevus_age35.svg", age: 35, site: "torso", stage: "Benign / Healthy" },
    { name: "Benign (Age 50)", file: "benign_nevus_age50.svg", age: 50, site: "upper_extremity", stage: "Benign / Healthy" }
  ];

  return (
    <div className="hub-section active" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.45rem', margin: 0 }}>
              <Activity size={26} style={{ color: 'var(--classical-color)' }} />
              Live Patient Inference & Early Disease Detection Studio
            </h1>
            <p className="subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Real-time multimodal disease prediction combining dermoscopy image uploads, CSV patient data, age factor risk weighting, early cancer staging (Stage 0/I/II), and Grad-CAM visual explainability.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {predictionResult && (
              <>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px' }}
                >
                  <Printer size={16} /> Print Clinical Report
                </button>
                <button
                  onClick={handleConsultQuddos}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', padding: '8px 16px', background: 'var(--classical-color)' }}
                >
                  <Bot size={16} /> Deep Consult with Quddos AI <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Multimodal Disease Dataset Selector Card */}
      <div className="card active-control-card" style={{ marginBottom: '20px', padding: '16px 20px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: 'var(--classical-color)' }} /> Active Early Disease Detection Target Dataset:
            </label>
            <span className="badge-paradigm badge-classical" style={{ fontSize: '0.72rem' }}>
              Multimodal Skin Cancer (ISIC / HAM10000)
            </span>
          </div>
          <select
            value="isic_skin_cancer"
            onChange={() => {}}
            className="form-select-inline"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="isic_skin_cancer">ISIC / HAM10000 Skin Cancer Multimodal Dataset (Image + CSV + Age Factor)</option>
          </select>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
            Upload any custom lesion image (`.jpg`, `.png`), patient `.csv` file, or select files from the <code>testing_images/</code> folder. The AI pipeline auto-extracts features and identifies whether the case is <strong>Stage 0 (Pre-Cancerous)</strong>, <strong>Stage I (Early Malignant)</strong>, <strong>Stage II+ (Invasive)</strong>, or <strong>Benign / Healthy</strong> with full Grad-CAM explainability.
          </div>
        </div>
      </div>

      {/* Flexible Input Toolbar (Tabs: Multimodal, Image Upload, CSV Upload, Clinical Form) */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--quantum-color)' }} /> Ingestion Modality Mode:
          </span>

          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setInputMode('multimodal')}
              className={`btn btn-sm ${inputMode === 'multimodal' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Sparkles size={14} /> Combined Multimodal
            </button>
            <button
              onClick={() => setInputMode('image')}
              className={`btn btn-sm ${inputMode === 'image' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <ImageIcon size={14} /> Photo / Image Upload
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`btn btn-sm ${inputMode === 'csv' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <FileText size={14} /> Patient CSV Upload
            </button>
            <button
              onClick={() => setInputMode('form')}
              className={`btn btn-sm ${inputMode === 'form' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Sliders size={14} /> Clinical Attributes Form
            </button>
          </div>
        </div>

        <form onSubmit={handleRunInference}>
          <div className="grid-3" style={{ gap: '16px', alignItems: 'start' }}>
            {/* Input Column 1: Image Upload / Preview */}
            {(inputMode === 'multimodal' || inputMode === 'image') && (
              <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ImageIcon size={16} style={{ color: 'var(--classical-color)' }} /> Dermoscopy / Lesion Photo Upload:
                </label>

                {imagePreview && (
                  <div style={{ position: 'relative', width: '100%', height: '160px', background: '#000', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <img
                      src={imagePreview}
                      alt="Uploaded lesion preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {gradCam && showGradCam && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${gradCam.roi_bounding_box[0] / 4}%`,
                          top: `${gradCam.roi_bounding_box[1] / 4}%`,
                          width: `${gradCam.roi_bounding_box[2] / 3}%`,
                          height: `${gradCam.roi_bounding_box[3] / 3}%`,
                          border: '2px dashed #f87171',
                          background: 'rgba(239, 68, 68, 0.35)',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                          boxShadow: '0 0 12px rgba(239,68,68,0.8)'
                        }}
                        title="Grad-CAM High Attention Region"
                      />
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload-input"
                />
                <label
                  htmlFor="image-upload-input"
                  className="btn btn-outline full-width-btn"
                  style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '8px 10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  <Upload size={14} /> {imageFile ? imageFile.name : 'Upload New Custom Image (.jpg/.png)'}
                </label>
              </div>
            )}

            {/* Input Column 2: Age Factor & Epidemiological Parameters */}
            {(inputMode === 'multimodal' || inputMode === 'form' || inputMode === 'image') && (
              <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <UserCheck size={16} style={{ color: 'var(--quantum-color)' }} /> Age & Epidemiological Baseline:
                </label>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>Patient Age:</span>
                    <span style={{ fontWeight: 700, color: 'var(--quantum-color)' }}>{patientAge} Years Old</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="90"
                    value={patientAge}
                    onChange={(e) => setPatientAge(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--quantum-color)' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Age risk weight: {patientAge >= 65 ? '+22% (High)' : (patientAge >= 50 ? '+12% (Moderate)' : 'Baseline')}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Anatomical Site Location:
                  </label>
                  <select
                    value={anatomicalSite}
                    onChange={(e) => setAnatomicalSite(e.target.value)}
                    className="form-select-inline"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.82rem' }}
                  >
                    <option value="face_scalp">Face / Scalp (Sun Exposed)</option>
                    <option value="upper_extremity">Upper Extremity (Arm / Shoulder)</option>
                    <option value="back_trunk">Back / Trunk</option>
                    <option value="lower_extremity">Lower Extremity (Leg / Foot)</option>
                    <option value="torso">Chest / Abdomen</option>
                  </select>
                </div>
              </div>
            )}

            {/* Input Column 3: CSV Dataset Upload & Features Form */}
            {(inputMode === 'multimodal' || inputMode === 'csv' || inputMode === 'form') && (
              <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FileText size={16} style={{ color: 'var(--hybrid-color)' }} /> Clinical CSV File / Numeric Features:
                </label>

                {inputMode !== 'form' && (
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      style={{ display: 'none' }}
                      id="csv-upload-input"
                    />
                    <label
                      htmlFor="csv-upload-input"
                      className="btn btn-outline full-width-btn"
                      style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '8px 10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      <Upload size={14} /> {csvFileName ? csvFileName : 'Upload Custom Patient Dataset (.csv)'}
                    </label>
                  </div>
                )}

                <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.76rem', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '4px', background: 'var(--bg-card-solid)' }}>
                  {Object.keys(features).slice(0, 4).map(feat => (
                    <div key={feat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>{feat}:</span>
                      <input
                        type="number"
                        step="any"
                        value={features[feat]}
                        onChange={(e) => handleInputChange(feat, e.target.value)}
                        style={{ width: '65px', padding: '1px 4px', fontSize: '0.74rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ fontSize: '0.92rem', padding: '10px 24px', background: 'var(--classical-color)' }}
            >
              {loading ? <Loader2 size={18} className="spinner" /> : <Play size={18} />}
              {loading ? 'Computing Quantum Multimodal Overlaps...' : 'Run Early Disease Risk Inference'}
            </button>
          </div>
        </form>
      </div>

      {/* Output Section Header with View Toggle Switch (Patient View vs Clinical View) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} style={{ color: 'var(--classical-color)' }} /> Diagnostic Risk & Explainability Results
        </h3>

        {/* Dual-View Switch Button */}
        <div style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('patient')}
            className={`btn btn-sm ${viewMode === 'patient' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <BookOpen size={14} /> Patient View
          </button>
          <button
            onClick={() => setViewMode('clinical')}
            className={`btn btn-sm ${viewMode === 'clinical' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Cpu size={14} /> Clinical View
          </button>
        </div>
      </div>

      {/* Main Results View */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <Loader2 size={44} className="spinner" style={{ marginBottom: '16px', color: 'var(--classical-color)' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Computing Hybrid Multimodal Quantum State Overlaps...
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Processing dermoscopy image features, age factor weighting, 4-qubit Hilbert projection, and tri-model ensemble.
          </p>
        </div>
      ) : predictionResult ? (
        <>
          {/* =============================================================== */}
          {/* 1. NON-TECHNICAL / PATIENT VIEW                                */}
          {/* =============================================================== */}
          {viewMode === 'patient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Early Disease Detection Banner */}
              <div className="card" style={{ borderLeft: `6px solid ${earlyDet?.badge_color || 'var(--classical-color)'}`, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        background: earlyDet?.badge_color || 'var(--classical-color)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {earlyDet?.badge_text}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {earlyDet?.stage_label}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: earlyDet?.badge_color || 'var(--classical-color)' }}>
                      {earlyDet?.confidence_pct}%
                    </span>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Disease Probability</div>
                  </div>
                </div>

                {/* Progress Bar / Risk Gauge */}
                <div style={{ width: '100%', background: 'var(--bg-inset)', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: `${earlyDet?.confidence_pct}%`,
                      height: '100%',
                      background: earlyDet?.badge_color || 'var(--classical-color)',
                      transition: 'width 0.8s ease-in-out'
                    }}
                  />
                </div>

                {/* Layman Plain-English Explanation */}
                <div style={{ background: 'var(--bg-inset)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} style={{ color: 'var(--classical-color)' }} /> What This Result Means For You (Plain Language):
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                    {earlyDet?.layman_summary}
                  </p>
                </div>

                {/* Actionable Protocol Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(56, 189, 248, 0.08)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <Stethoscope size={20} style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    <strong>Recommended Next Step:</strong> {earlyDet?.action_plan}
                  </div>
                </div>
              </div>

              {/* Patient Visual Heatmap & Age Factor Grid */}
              <div className="grid-2" style={{ gap: '20px' }}>
                {/* Left Card: Image & Grad-CAM Heatmap Visual Explanation */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={16} style={{ color: 'var(--quantum-color)' }} /> AI Visual Focus (Grad-CAM Heatmap):
                    </h4>
                    <button
                      onClick={() => setShowGradCam(!showGradCam)}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.74rem' }}
                    >
                      {showGradCam ? 'Hide Heatmap' : 'Show Heatmap'}
                    </button>
                  </div>

                  <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Lesion visual analysis"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {showGradCam && gradCam && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${gradCam.roi_bounding_box[0] / 4}%`,
                          top: `${gradCam.roi_bounding_box[1] / 4}%`,
                          width: `${gradCam.roi_bounding_box[2] / 3}%`,
                          height: `${gradCam.roi_bounding_box[3] / 3}%`,
                          border: '2px dashed #f87171',
                          background: 'rgba(239, 68, 68, 0.38)',
                          borderRadius: '50%',
                          boxShadow: '0 0 16px rgba(239,68,68,0.9)'
                        }}
                      />
                    )}
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    The dashed red area shows the exact region of the photo where the Quantum AI detected cell irregularities.
                  </p>
                </div>

                {/* Right Card: Key Risk Contributors & Age Factor */}
                <div className="card">
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={16} style={{ color: 'var(--hybrid-color)' }} /> Key Risk Factors & Patient Age Breakdown:
                  </h4>

                  <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      Age Factor ({ageFactor?.patient_age || patientAge} Years Old):
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {ageFactor?.age_tier} ({ageFactor?.clinical_notes})
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Top Suspicious Visual & Biomarker Drivers:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(gradCam?.top_suspicious_features || [
                      "Asymmetric pigment boundary",
                      "Diameter irregularity > 6mm",
                      `Patient Age ${patientAge} risk weight`
                    ]).map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-inset)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.78rem' }}>
                        <CheckCircle size={14} style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. CLINICAL / TECHNICAL VIEW                                   */}
          {/* =============================================================== */}
          {viewMode === 'clinical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tri-Model Diagnostic Grid */}
              <div className="grid-3" style={{ gap: '16px' }}>
                {/* Classical Card */}
                <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--classical-color)' }}>
                  <div className="pred-title">1. Classical RBF Support Vector Machine</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <span className={`pred-badge ${predictions?.classical_rbf_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`}>
                      {predictions?.classical_rbf_svm?.label}
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--classical-color)' }}>
                      {(predictions?.classical_rbf_svm?.probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Confidence: {predictions?.classical_rbf_svm?.confidence_pct}%
                  </div>
                </div>

                {/* Quantum Card */}
                <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--quantum-color)' }}>
                  <div className="pred-title">2. Quantum Kernel QSVM (ZZFeatureMap)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <span className={`pred-badge ${predictions?.quantum_kernel_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`}>
                      {predictions?.quantum_kernel_svm?.label}
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--quantum-color)' }}>
                      {(predictions?.quantum_kernel_svm?.probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    4 Qubits | ZZFeatureMap (reps=2)
                  </div>
                </div>

                {/* Hybrid Consensus Card */}
                <div className="pred-card highlight" style={{ textAlign: 'left', borderLeft: '4px solid var(--hybrid-color)' }}>
                  <div className="pred-title" style={{ color: 'var(--hybrid-color)', fontWeight: 600 }}>3. Hybrid Consensus Ensemble</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <span className="badge-paradigm badge-hybrid">
                      {earlyDet?.stage_label || predictions?.hybrid_consensus_ensemble?.label}
                    </span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--hybrid-color)' }}>
                      {(earlyDet?.confidence_pct || (predictions?.hybrid_consensus_ensemble?.probability * 100)).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--hybrid-color)' }}>
                    {earlyDet?.badge_text || predictions?.hybrid_consensus_ensemble?.risk_tier}
                  </div>
                </div>
              </div>

              {/* Uncertainty Quantification */}
              {uncertainty && (
                <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} style={{ color: uncertainty.is_classical_quantum_discordant ? 'var(--status-danger)' : 'var(--status-success)' }} />
                      Epistemic & Aleatoric Uncertainty Metrics:
                    </span>
                    <span className="val-badge ready" style={{ fontSize: '0.72rem' }}>
                      Consensus: {(uncertainty.consensus_confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div className="metric-mini-box" style={{ background: 'var(--bg-card-solid)', padding: '8px 12px' }}>
                      <div className="mini-val" style={{ fontSize: '0.95rem' }}>{uncertainty.epistemic_uncertainty}</div>
                      <div className="mini-lbl" style={{ fontSize: '0.7rem' }}>Epistemic Model Ambiguity</div>
                    </div>
                    <div className="metric-mini-box" style={{ background: 'var(--bg-card-solid)', padding: '8px 12px' }}>
                      <div className="mini-val" style={{ fontSize: '0.95rem' }}>{uncertainty.aleatoric_uncertainty}</div>
                      <div className="mini-lbl" style={{ fontSize: '0.7rem' }}>Aleatoric Observation Noise</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Quantum Hilbert Telemetry */}
              <div className="card">
                <button
                  onClick={() => setShowAdvancedResults(!showAdvancedResults)}
                  className="btn btn-sm btn-outline full-width-btn"
                  type="button"
                >
                  <Cpu size={14} /> {showAdvancedResults ? 'Hide' : 'Show'} Quantum Hilbert State Telemetry
                  {showAdvancedResults ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvancedResults && predictionResult && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-inset)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div><strong style={{ color: 'var(--quantum-color)' }}>PCA Compressed Components (4 Qubits):</strong> [{predictionResult.quantum_compressed_coordinates?.join(', ')}]</div>
                    <div style={{ marginTop: '4px' }}><strong style={{ color: 'var(--quantum-color)' }}>Bloch Angles [0, π]:</strong> [{predictionResult.quantum_rotation_angles?.join(', ')}]</div>
                    {blochCoords && (
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <strong>Bloch 3D Vector Coordinates:</strong>
                        {blochCoords.map(c => ` Q${c.qubit_index}: (${c.x}, ${c.y}, ${c.z})`).join(' | ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <Activity size={44} style={{ marginBottom: '14px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.92rem' }}>
            Select a benchmark patient profile archetype or upload custom image/CSV data, then click <strong>"Run Early Disease Risk Inference"</strong> to compute real-time quantum predictions.
          </p>
        </div>
      )}

      {/* =============================================================== */}
      {/* PRINT-READY CLINICAL DIAGNOSTIC REPORT MODAL                    */}
      {/* =============================================================== */}
      {showPrintModal && predictionResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.75)',
            zIndex: 9999,
            display: 'flex',
            justify: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#fff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem' }}>
                  Quddos Studio — Clinical Diagnostic Report
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Hybrid Quantum-Classical Early Disease Detection System
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
                  Date: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Report Patient Profile Header */}
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Patient Profile:</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedPreset?.name || 'Custom Multimodal Patient'}</div>
                <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '2px' }}>
                  Age: {patientAge} Years | Site: {anatomicalSite}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Early Staging Verdict:</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: earlyDet?.badge_color || '#0284c7' }}>
                  {earlyDet?.stage_label}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Risk Score: {earlyDet?.confidence_pct}%
                </div>
              </div>
            </div>

            {/* Report Image & Heatmap Section */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ width: '180px', height: '150px', background: '#000', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={imagePreview} alt="Report Lesion" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                <strong>Grad-CAM Visual AI Findings:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#334155' }}>
                  High-attention cell irregularity detected at bounding region [{gradCam?.roi_bounding_box?.join(', ')}]. Heatmap intensity score: {gradCam?.heatmap_intensity}.
                </p>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569' }}>
                  <strong>Layman Summary:</strong> {earlyDet?.layman_summary}
                </div>
              </div>
            </div>

            {/* Tri-Model Summary Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Model Paradigm</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Prediction</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Classical RBF SVM</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{predictions?.classical_rbf_svm?.label}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{predictions?.classical_rbf_svm?.confidence_pct}%</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Quantum Kernel QSVM (4 Qubits)</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{predictions?.quantum_kernel_svm?.label}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{predictions?.quantum_kernel_svm?.confidence_pct}%</td>
                </tr>
                <tr style={{ fontWeight: 700, background: '#f0f9ff' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Hybrid Consensus Ensemble</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{earlyDet?.stage_label}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{earlyDet?.confidence_pct}%</td>
                </tr>
              </tbody>
            </table>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                onClick={() => setShowPrintModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.84rem' }}
              >
                Close Window
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ fontSize: '0.84rem', background: '#0284c7' }}
              >
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
