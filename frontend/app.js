const API_BASE = "http://localhost:8000/api";

// Application State
let currentDataset = "heart.csv";
let datasetsList = [];
let trainedModelRuns = []; // Saved model runs in library
let currentBenchmarkTable = [];
let currentShapImportances = [];
let charts = {};
let samplePreviewData = [];
let currentFeatureNames = [];

document.addEventListener("DOMContentLoaded", () => {
    initHubNavigation();
    initDatasetDropdown();
    initUploadModal();
    initModalClosers();
    fetchDatasetsList();
    loadDatasetData(currentDataset);
    loadSavedModelLibrary();
});

// 1. Navigation Hub Switching
function initHubNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const targetHub = item.getAttribute("data-hub");
            document.querySelectorAll(".hub-section").forEach(sec => sec.classList.remove("active"));
            const activeSection = document.getElementById(`hub-${targetHub}`);
            if (activeSection) {
                activeSection.classList.add("active");
            }
        });
    });

    // Action buttons bindings
    document.getElementById("btnTrainModels").addEventListener("click", trainModelsPipeline);
    document.getElementById("btnSaveToLibrary").addEventListener("click", saveRunToModelLibrary);
    document.getElementById("btnPredict").addEventListener("click", runPatientPrediction);
    document.getElementById("btnLoadNormal").addEventListener("click", () => loadPresetSample("normal"));
    document.getElementById("btnLoadHighRisk").addEventListener("click", () => loadPresetSample("highrisk"));
}

// 2. Datasets Management & Fetching
function initDatasetDropdown() {
    const select = document.getElementById("datasetSelect");
    select.addEventListener("change", (e) => {
        currentDataset = e.target.value;
        updateActiveDatasetPill(currentDataset);
        loadDatasetData(currentDataset);
    });
}

function updateActiveDatasetPill(datasetId) {
    const activePill = document.getElementById("activeDatasetName");
    const found = datasetsList.find(d => d.id === datasetId);
    const displayName = found ? found.name : datasetId;
    if (activePill) activePill.innerText = displayName;
    
    const inferName = document.getElementById("inferDatasetName");
    if (inferName) inferName.innerText = `Active Dataset: ${displayName}`;
}

async function fetchDatasetsList() {
    try {
        const res = await fetch(`${API_BASE}/datasets`);
        const data = await res.json();
        datasetsList = data.datasets || [];

        renderDatasetsGrid();
        populateDatasetDropdown();
        updateActiveDatasetPill(currentDataset);
    } catch (err) {
        console.error("Failed to fetch datasets list:", err);
    }
}

function populateDatasetDropdown() {
    const select = document.getElementById("datasetSelect");
    let html = "";
    datasetsList.forEach(ds => {
        const selected = ds.id === currentDataset ? "selected" : "";
        html += `<option value="${ds.id}" ${selected}>${ds.name}</option>`;
    });
    select.innerHTML = html;
}

function renderDatasetsGrid() {
    const grid = document.getElementById("datasetsGrid");
    if (!grid) return;

    let html = "";
    datasetsList.forEach(ds => {
        const isActive = ds.id === currentDataset;
        const activeClass = isActive ? "active-ds" : "";
        
        html += `<div class="card dataset-card-item ${activeClass}">
            <div>
                <div class="dataset-header">
                    <span class="dataset-title">${ds.name}</span>
                    <span class="dataset-badge">${ds.samples} rows</span>
                </div>
                <p class="subtitle" style="font-size:0.85rem;">Target Column: <strong>${ds.target_column}</strong></p>
                <div class="dataset-meta">
                    <div class="meta-item">Features: <span>${ds.features}</span></div>
                    <div class="meta-item">Format: <span>Tabular CSV</span></div>
                </div>
            </div>
            <div class="dataset-actions" style="margin-top:16px;">
                <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}" onclick="selectActiveDataset('${ds.id}')">
                    ${isActive ? '✓ Active Dataset' : 'Set Active'}
                </button>
                <button class="btn btn-sm btn-outline" onclick="previewDatasetData('${ds.id}')">👁 Preview</button>
            </div>
        </div>`;
    });
    grid.innerHTML = html;
}

function selectActiveDataset(datasetId) {
    currentDataset = datasetId;
    populateDatasetDropdown();
    updateActiveDatasetPill(currentDataset);
    renderDatasetsGrid();
    loadDatasetData(currentDataset);
}

async function previewDatasetData(datasetId) {
    try {
        const res = await fetch(`${API_BASE}/preprocess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_id: datasetId, n_qubits: 4, apply_smote: false })
        });
        const data = await res.json();
        
        document.getElementById("previewModalTitle").innerText = `Dataset Preview: ${datasetId}`;
        renderTablePreview("dataPreviewTable", data.sample_preview);
        document.getElementById("dataPreviewModal").classList.remove("hidden");
    } catch (err) {
        console.error("Failed to preview dataset:", err);
    }
}

async function loadDatasetData(datasetId) {
    try {
        const res = await fetch(`${API_BASE}/preprocess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_id: datasetId, n_qubits: 4, apply_smote: true })
        });
        const data = await res.json();
        
        samplePreviewData = data.sample_preview || [];
        currentFeatureNames = data.feature_names || [];
        
        // Build dynamic single-value inference form
        buildPatientForm(currentFeatureNames, samplePreviewData[0]);
    } catch (err) {
        console.error("Error loading dataset data:", err);
    }
}

function renderTablePreview(tableId, records) {
    const table = document.getElementById(tableId);
    if (!records || records.length === 0) return;

    const keys = Object.keys(records[0]);
    let html = "<thead><tr>" + keys.map(k => `<th>${k}</th>`).join("") + "</tr></thead><tbody>";
    records.forEach(r => {
        html += "<tr>" + keys.map(k => `<td>${r[k]}</td>`).join("") + "</tr>";
    });
    html += "</tbody>";
    table.innerHTML = html;
}

// 3. Upload New CSV Modal & Dropzone
function initUploadModal() {
    const openBtn = document.getElementById("btnOpenUploadModal");
    const closeBtn = document.getElementById("btnCloseUploadModal");
    const modal = document.getElementById("uploadModal");
    const dropzone = document.getElementById("csvDropzone");
    const fileInput = document.getElementById("csvFileInput");
    const uploadProgress = document.getElementById("uploadProgress");

    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--accent-cyan)";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "var(--border-color)";
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--border-color)";
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    if (!file.name.endsWith(".csv")) {
        alert("Please select a tabular .csv file.");
        return;
    }

    const uploadProgress = document.getElementById("uploadProgress");
    uploadProgress.classList.remove("hidden");
    uploadProgress.innerText = `Uploading and parsing ${file.name}...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE}/upload_dataset`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (!res.ok) {
            alert(`Upload failed: ${data.detail || 'Invalid CSV format'}`);
            uploadProgress.classList.add("hidden");
            return;
        }

        uploadProgress.innerText = `✓ Successfully uploaded ${file.name}!`;
        setTimeout(() => {
            document.getElementById("uploadModal").classList.add("hidden");
            uploadProgress.classList.add("hidden");
            fetchDatasetsList();
            selectActiveDataset(data.dataset.id);
        }, 1000);
    } catch (err) {
        console.error("Error uploading CSV:", err);
        alert("Server error uploading CSV dataset.");
        uploadProgress.classList.add("hidden");
    }
}

function initModalClosers() {
    document.getElementById("btnClosePreviewModal")?.addEventListener("click", () => {
        document.getElementById("dataPreviewModal").classList.add("hidden");
    });

    document.getElementById("btnCloseDetailModal")?.addEventListener("click", () => {
        document.getElementById("modelDetailModal").classList.add("hidden");
    });
}

// 4. Model Training Pipeline
async function trainModelsPipeline() {
    const btn = document.getElementById("btnTrainModels");
    const statusTxt = document.getElementById("engineStatusTxt");
    const pBox = document.getElementById("trainProgressBox");
    const pBar = document.getElementById("trainProgressBar");
    const saveBtn = document.getElementById("btnSaveToLibrary");

    btn.disabled = true;
    statusTxt.innerText = "Training...";
    statusTxt.className = "val-badge running";
    pBox.classList.remove("hidden");
    pBar.style.width = "35%";

    try {
        pBar.style.width = "70%";
        const res = await fetch(`${API_BASE}/train`, { method: "POST" });
        const data = await res.json();
        pBar.style.width = "100%";

        setTimeout(() => pBox.classList.add("hidden"), 600);

        currentBenchmarkTable = data.benchmark_table || [];
        renderBenchmarkTable(currentBenchmarkTable);
        renderBenchmarkChart(currentBenchmarkTable);

        statusTxt.innerText = "Completed";
        statusTxt.className = "val-badge ready";
        saveBtn.disabled = false;

        // Auto-fetch SHAP Explainability
        fetchExplainability();
    } catch (err) {
        console.error("Training error:", err);
        statusTxt.innerText = "Error";
        statusTxt.className = "val-badge";
    } finally {
        btn.disabled = false;
    }
}

// 5. Render Benchmarking Table & Charts
function renderBenchmarkTable(tableData) {
    const tbody = document.querySelector("#benchmarkTable tbody");
    if (!tbody) return;

    let html = "";
    tableData.forEach(row => {
        const catBadge = row.category === "Quantum" ? `<span class="badge-paradigm badge-quantum">Quantum</span>` : 
                         row.category === "Hybrid" ? `<span class="badge-paradigm badge-hybrid">Hybrid</span>` : 
                         `<span class="badge-paradigm badge-classical">Classical</span>`;
        
        html += `<tr>
            <td><strong>${row.model}</strong></td>
            <td>${catBadge}</td>
            <td><span style="color:var(--accent-green);font-weight:700;">${row.accuracy}%</span></td>
            <td>${row.sensitivity}%</td>
            <td>${row.specificity}%</td>
            <td>${row.precision}%</td>
            <td>${row.f1_score}%</td>
            <td>${row.auc_roc}</td>
            <td>${row.train_time_sec}s</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function renderBenchmarkChart(tableData) {
    const ctx = document.getElementById("benchmarkBarChart")?.getContext("2d");
    if (!ctx) return;
    if (charts.benchmark) charts.benchmark.destroy();

    const labels = tableData.map(r => r.model);
    const accs = tableData.map(r => r.accuracy);
    const aucs = tableData.map(r => (r.auc_roc * 100).toFixed(1));

    charts.benchmark = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                { label: "Accuracy (%)", data: accs, backgroundColor: "#00f2fe" },
                { label: "AUC-ROC (%)", data: aucs, backgroundColor: "#a855f7" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                y: { min: 40, max: 100, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
            },
            plugins: { legend: { labels: { color: "#94a3b8" } } }
        }
    });
}

async function fetchExplainability() {
    try {
        const res = await fetch(`${API_BASE}/explain`);
        const data = await res.json();
        currentShapImportances = data.feature_importances || [];
        renderShapChart(currentShapImportances);
    } catch (err) {
        console.error("SHAP explainability error:", err);
    }
}

function renderShapChart(importances) {
    const ctx = document.getElementById("shapBarChart")?.getContext("2d");
    if (!ctx) return;
    if (charts.shap) charts.shap.destroy();

    const labels = importances.map(i => i.feature);
    const values = importances.map(i => i.importance);

    charts.shap = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "SHAP Importance (%)",
                data: values,
                backgroundColor: "rgba(0, 242, 254, 0.6)",
                borderColor: "#00f2fe",
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
            },
            plugins: { legend: { labels: { color: "#94a3b8" } } }
        }
    });
}

// 6. Model Library Storage & Modal Details
function saveRunToModelLibrary() {
    if (!currentBenchmarkTable || currentBenchmarkTable.length === 0) return;

    const dsObj = datasetsList.find(d => d.id === currentDataset);
    const dsName = dsObj ? dsObj.name : currentDataset;

    currentBenchmarkTable.forEach(item => {
        const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        trainedModelRuns.push({
            id: runId,
            model: item.model,
            category: item.category,
            accuracy: item.accuracy,
            sensitivity: item.sensitivity,
            specificity: item.specificity,
            precision: item.precision,
            f1_score: item.f1_score,
            auc_roc: item.auc_roc,
            train_time_sec: item.train_time_sec,
            datasetId: currentDataset,
            datasetName: dsName,
            trainedAt: new Date().toLocaleTimeString(),
            featureImportances: currentShapImportances
        });
    });

    saveModelLibraryToLocalStorage();
    renderModelLibraryGrid();
    alert(`✓ Saved ${currentBenchmarkTable.length} trained models to Model Library!`);
}

function saveModelLibraryToLocalStorage() {
    localStorage.setItem("qmed_model_library", JSON.stringify(trainedModelRuns));
}

function loadSavedModelLibrary() {
    const stored = localStorage.getItem("qmed_model_library");
    if (stored) {
        try {
            trainedModelRuns = JSON.parse(stored);
        } catch (e) {
            trainedModelRuns = [];
        }
    } else {
        // Seed initial default trained models if empty
        trainedModelRuns = [
            {
                id: "run_seed_hybrid",
                model: "Soft Voting Ensemble",
                category: "Hybrid",
                accuracy: 98.3,
                sensitivity: 97.5,
                specificity: 99.1,
                precision: 98.8,
                f1_score: 98.1,
                auc_roc: 0.992,
                train_time_sec: 1.45,
                datasetId: "heart.csv",
                datasetName: "UCI Heart Disease (13 Feat)",
                trainedAt: "Initial Benchmark",
                featureImportances: [
                    { feature: "cp", importance: 28.5 },
                    { feature: "thalach", importance: 22.1 },
                    { feature: "oldpeak", importance: 18.4 },
                    { feature: "ca", importance: 16.2 }
                ]
            },
            {
                id: "run_seed_qsvm",
                model: "Quantum Kernel (QSVM)",
                category: "Quantum",
                accuracy: 94.2,
                sensitivity: 93.8,
                specificity: 94.6,
                precision: 94.0,
                f1_score: 93.9,
                auc_roc: 0.968,
                train_time_sec: 3.12,
                datasetId: "heart.csv",
                datasetName: "UCI Heart Disease (13 Feat)",
                trainedAt: "Initial Benchmark",
                featureImportances: [
                    { feature: "cp", importance: 25.0 },
                    { feature: "thalach", importance: 24.0 }
                ]
            },
            {
                id: "run_seed_rf",
                model: "Random Forest",
                category: "Classical",
                accuracy: 91.8,
                sensitivity: 90.5,
                specificity: 93.0,
                precision: 92.1,
                f1_score: 91.3,
                auc_roc: 0.954,
                train_time_sec: 0.28,
                datasetId: "heart.csv",
                datasetName: "UCI Heart Disease (13 Feat)",
                trainedAt: "Initial Benchmark",
                featureImportances: [
                    { feature: "cp", importance: 30.1 }
                ]
            }
        ];
    }
    renderModelLibraryGrid();
}

function renderModelLibraryGrid() {
    const grid = document.getElementById("libraryGrid");
    if (!grid) return;

    if (trainedModelRuns.length === 0) {
        grid.innerHTML = `<div class="card full-width" style="text-align:center;color:var(--text-secondary);">No saved models in library yet. Train models in Model Studio and click "Save Run to Library".</div>`;
        return;
    }

    let html = "";
    trainedModelRuns.forEach(run => {
        const badgeClass = run.category === "Quantum" ? "badge-quantum" :
                           run.category === "Hybrid" ? "badge-hybrid" : "badge-classical";
                           
        html += `<div class="card model-card-item">
            <div>
                <div class="dataset-header">
                    <span class="dataset-title">${run.model}</span>
                    <span class="badge-paradigm ${badgeClass}">${run.category}</span>
                </div>
                <p class="subtitle" style="font-size:0.82rem;margin-top:4px;">Dataset: <strong>${run.datasetName}</strong></p>
                <div class="model-metrics-grid">
                    <div class="metric-mini-box">
                        <div class="mini-val">${run.accuracy}%</div>
                        <div class="mini-lbl">Accuracy</div>
                    </div>
                    <div class="metric-mini-box">
                        <div class="mini-val" style="color:var(--accent-purple);">${(run.auc_roc * 100).toFixed(1)}%</div>
                        <div class="mini-lbl">AUC Score</div>
                    </div>
                </div>
            </div>
            <button class="btn btn-sm btn-outline full-width-btn" onclick="openModelDetailModal('${run.id}')">
                🔍 Inspect Details & Provenance
            </button>
        </div>`;
    });
    grid.innerHTML = html;
}

function openModelDetailModal(runId) {
    const run = trainedModelRuns.find(r => r.id === runId);
    if (!run) return;

    document.getElementById("modalModelName").innerText = run.model;
    const catBadge = document.getElementById("modalModelCategory");
    catBadge.innerText = run.category;
    catBadge.className = `badge-paradigm ${run.category === "Quantum" ? "badge-quantum" : run.category === "Hybrid" ? "badge-hybrid" : "badge-classical"}`;

    const body = document.getElementById("modalModelBody");
    
    let featHtml = "";
    if (run.featureImportances && run.featureImportances.length > 0) {
        featHtml = run.featureImportances.map(f => `<li><strong>${f.feature}</strong>: ${f.importance}% importance</li>`).join("");
    } else {
        featHtml = "<li>Standard clinical feature importance mapping</li>";
    }

    body.innerHTML = `
        <div style="margin-bottom:20px;">
            <p style="color:var(--text-secondary);font-size:0.9rem;">
                Trained on Dataset: <strong style="color:var(--accent-cyan);">${run.datasetName}</strong> (${run.datasetId})
            </p>
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">
                Timestamp: ${run.trainedAt || 'Recorded Run'}
            </p>
        </div>

        <h4 style="margin-bottom:12px;">Full Performance Metrics Matrix</h4>
        <div class="grid-3" style="margin-bottom:20px;">
            <div class="metric-mini-box">
                <div class="mini-val">${run.accuracy}%</div>
                <div class="mini-lbl">Accuracy</div>
            </div>
            <div class="metric-mini-box">
                <div class="mini-val" style="color:var(--accent-green);">${run.sensitivity}%</div>
                <div class="mini-lbl">Sensitivity (Recall)</div>
            </div>
            <div class="metric-mini-box">
                <div class="mini-val">${run.specificity}%</div>
                <div class="mini-lbl">Specificity</div>
            </div>
            <div class="metric-mini-box">
                <div class="mini-val">${run.precision}%</div>
                <div class="mini-lbl">Precision</div>
            </div>
            <div class="metric-mini-box">
                <div class="mini-val">${run.f1_score}%</div>
                <div class="mini-lbl">F1-Score</div>
            </div>
            <div class="metric-mini-box">
                <div class="mini-val" style="color:var(--accent-purple);">${run.auc_roc}</div>
                <div class="mini-lbl">AUC-ROC</div>
            </div>
        </div>

        <h4 style="margin-bottom:10px;">Quantum Circuit & Architecture Specs</h4>
        <div class="card inner-card" style="margin-bottom:20px;font-size:0.88rem;line-height:1.6;">
            <div><strong>Simulator Backend:</strong> PennyLane <code>default.qubit</code> Statevector Simulator</div>
            <div><strong>Quantum Qubits:</strong> 4 Qubits (Angle Encoding RY-RZ)</div>
            <div><strong>Circuit Depth:</strong> 2 Parameterized Entanglement Layers</div>
            <div><strong>Train Duration:</strong> ${run.train_time_sec} seconds</div>
        </div>

        <h4 style="margin-bottom:10px;">Top Feature Importances</h4>
        <ul style="padding-left:20px;font-size:0.88rem;color:#cbd5e1;line-height:1.6;">
            ${featHtml}
        </ul>
    `;

    document.getElementById("modelDetailModal").classList.remove("hidden");
}

// 7. Single-Sample Patient Inference Form & Presets
function buildPatientForm(featureNames, sampleRow) {
    const form = document.getElementById("patientForm");
    if (!form) return;

    let html = "";
    featureNames.forEach(feat => {
        const val = sampleRow && sampleRow[feat] !== undefined ? sampleRow[feat] : 0;
        html += `<div class="form-group">
            <label>${feat}</label>
            <input type="number" step="any" name="${feat}" value="${val}">
        </div>`;
    });
    form.innerHTML = html;
}

function loadPresetSample(type) {
    const form = document.getElementById("patientForm");
    if (!form) return;

    let presetValues = {};

    if (currentDataset === "heart.csv") {
        if (type === "normal") {
            presetValues = { age: 42, sex: 0, cp: 0, trestbps: 118, chol: 185, fbs: 0, restecg: 0, thalach: 172, exang: 0, oldpeak: 0.0, slope: 2, ca: 0, thal: 2 };
        } else {
            presetValues = { age: 64, sex: 1, cp: 3, trestbps: 165, chol: 295, fbs: 1, restecg: 1, thalach: 105, exang: 1, oldpeak: 2.8, slope: 0, ca: 2, thal: 3 };
        }
    } else if (currentDataset === "diabetes.csv") {
        if (type === "normal") {
            presetValues = { Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 20, Insulin: 79, BMI: 22.5, DiabetesPedigreeFunction: 0.167, Age: 24 };
        } else {
            presetValues = { Pregnancies: 8, Glucose: 178, BloodPressure: 90, SkinThickness: 36, Insulin: 185, BMI: 38.5, DiabetesPedigreeFunction: 0.850, Age: 54 };
        }
    } else if (currentDataset === "parkinsons.csv") {
        if (type === "normal") {
            presetValues = { "MDVP:Fo(Hz)": 200.5, "MDVP:Fhi(Hz)": 230.1, "MDVP:Flo(Hz)": 180.2, "MDVP:Jitter(%)": 0.003, "MDVP:Shimmer": 0.015, NHR: 0.005, HNR: 26.5, RPDE: 0.35, DFA: 0.60, spread1: -6.5, spread2: 0.12, D2: 1.8, PPE: 0.08 };
        } else {
            presetValues = { "MDVP:Fo(Hz)": 119.9, "MDVP:Fhi(Hz)": 142.3, "MDVP:Flo(Hz)": 89.2, "MDVP:Jitter(%)": 0.022, "MDVP:Shimmer": 0.085, NHR: 0.120, HNR: 14.2, RPDE: 0.62, DFA: 0.78, spread1: -3.2, spread2: 0.38, D2: 2.9, PPE: 0.42 };
        }
    } else {
        // Fallback for custom uploaded CSV: set normal to low values, high risk to high values
        currentFeatureNames.forEach(f => {
            presetValues[f] = type === "normal" ? 10 : 90;
        });
    }

    // Prefill inputs
    for (const [key, val] of Object.entries(presetValues)) {
        const input = form.querySelector(`input[name="${key}"]`);
        if (input) input.value = val;
    }
}

async function runPatientPrediction() {
    const form = document.getElementById("patientForm");
    const formData = new FormData(form);
    const patientData = {};
    formData.forEach((val, key) => patientData[key] = parseFloat(val) || 0);

    try {
        const res = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patient_data: patientData })
        });
        const data = await res.json();
        
        renderPredictionCards(data.predictions);
        document.getElementById("clinicianReport").innerHTML = data.clinician_summary.replace(/\n/g, "<br>");
    } catch (err) {
        console.error("Prediction error:", err);
        alert("Error running inference. Please ensure models are trained first in Model Studio.");
    }
}

function renderPredictionCards(preds) {
    const container = document.getElementById("predictionCards");
    if (!container) return;

    let html = "";
    for (const [modelName, pdict] of Object.entries(preds)) {
        const badgeClass = pdict.label === 1 ? "badge-positive" : "badge-negative";
        const labelText = pdict.label === 1 ? "High Risk (1)" : "Healthy (0)";
        const isHighlight = modelName.includes("Hybrid") ? "highlight" : "";

        html += `<div class="pred-card ${isHighlight}">
            <div class="pred-title">${modelName}</div>
            <div class="pred-badge ${badgeClass}">${labelText}</div>
            <div style="font-size:0.85rem;margin-top:4px;">Risk: <strong>${(pdict.probability * 100).toFixed(1)}%</strong></div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">Confidence: ${pdict.confidence}</div>
        </div>`;
    }
    container.innerHTML = html;
}
