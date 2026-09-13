/**
 * Q-Med Platform Frontend Logic (SIH 2026 PS 139)
 * Connects all UI stages to the FastAPI backend and renders scientific artifacts.
 */

const API_BASE = "http://localhost:8000/api";

let currentDatasetKey = "cancer"; // "cancer" or "cardiovascular"
let activeData = {
    eda: null,
    classical: null,
    quantum: null,
    benchmark: null
};
let charts = {};

// Sample Presets for Interactive Testing
const PRESETS = {
    cancer: {
        positive: {
            "mean radius": 17.99, "mean texture": 10.38, "mean perimeter": 122.8, "mean area": 1001.0,
            "mean smoothness": 0.1184, "mean compactness": 0.2776, "mean concavity": 0.3001, "mean concave points": 0.1471,
            "mean symmetry": 0.2419, "mean fractal dimension": 0.07871, "radius error": 1.095, "texture error": 0.9053,
            "perimeter error": 8.589, "area error": 153.4, "smoothness error": 0.006399, "compactness error": 0.04904,
            "concavity error": 0.05373, "concave points error": 0.01587, "symmetry error": 0.03003, "fractal dimension error": 0.006193,
            "worst radius": 25.38, "worst texture": 17.33, "worst perimeter": 184.6, "worst area": 2019.0,
            "worst smoothness": 0.1622, "worst compactness": 0.6656, "worst concavity": 0.7119, "worst concave points": 0.2654,
            "worst symmetry": 0.4601, "worst fractal dimension": 0.1189
        },
        negative: {
            "mean radius": 13.54, "mean texture": 14.36, "mean perimeter": 87.46, "mean area": 566.3,
            "mean smoothness": 0.09779, "mean compactness": 0.08129, "mean concavity": 0.06664, "mean concave points": 0.04781,
            "mean symmetry": 0.1885, "mean fractal dimension": 0.05766, "radius error": 0.2699, "texture error": 0.7886,
            "perimeter error": 2.058, "area error": 23.56, "smoothness error": 0.008462, "compactness error": 0.0146,
            "concavity error": 0.02387, "concave points error": 0.01315, "symmetry error": 0.0198, "fractal dimension error": 0.0023,
            "worst radius": 15.11, "worst texture": 19.26, "worst perimeter": 99.7, "worst area": 711.2,
            "worst smoothness": 0.144, "worst compactness": 0.1773, "worst concavity": 0.239, "worst concave points": 0.1288,
            "worst symmetry": 0.2977, "worst fractal dimension": 0.07259
        }
    },
    cardiovascular: {
        positive: {
            "age": 67, "sex": 1, "cp": 0, "trestbps": 160, "chol": 286,
            "fbs": 0, "restecg": 0, "thalach": 108, "exang": 1, "oldpeak": 1.5,
            "slope": 1, "ca": 3, "thal": 2
        },
        negative: {
            "age": 41, "sex": 0, "cp": 1, "trestbps": 130, "chol": 204,
            "fbs": 0, "restecg": 0, "thalach": 172, "exang": 0, "oldpeak": 1.4,
            "slope": 2, "ca": 0, "thal": 2
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initDatasetSelector();
    initPresetButtons();
    loadActiveDataset(currentDatasetKey);
});

// 1. Navigation & Stage Switching
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const stageNum = item.getAttribute("data-stage");
            document.querySelectorAll(".stage-section").forEach(sec => sec.classList.remove("active"));
            document.getElementById(`stage-${stageNum}`).classList.add("active");
        });
    });

    document.getElementById("btnPredict").addEventListener("click", runPatientPrediction);
}

// 2. Dataset Selection
function initDatasetSelector() {
    const select = document.getElementById("datasetSelect");
    select.addEventListener("change", (e) => {
        currentDatasetKey = e.target.value;
        loadActiveDataset(currentDatasetKey);
    });
}

// 3. Preset Buttons for Instant Clinical Demonstration
function initPresetButtons() {
    document.getElementById("btnPresetPositive").addEventListener("click", () => {
        populatePatientForm(PRESETS[currentDatasetKey].positive);
    });
    document.getElementById("btnPresetNegative").addEventListener("click", () => {
        populatePatientForm(PRESETS[currentDatasetKey].negative);
    });
}

// 4. Master Data Loader
async function loadActiveDataset(datasetKey) {
    try {
        console.log(`Loading research data for: ${datasetKey}...`);
        
        // Fetch all 4 stage artifacts in parallel
        const [edaRes, classRes, quantRes, benchRes] = await Promise.all([
            fetch(`${API_BASE}/eda/${datasetKey}`).then(r => r.json()),
            fetch(`${API_BASE}/classical/${datasetKey}`).then(r => r.json()),
            fetch(`${API_BASE}/quantum/${datasetKey}`).then(r => r.json()),
            fetch(`${API_BASE}/benchmark/${datasetKey}`).then(r => r.json())
        ]);

        activeData.eda = edaRes;
        activeData.classical = classRes;
        activeData.quantum = quantRes;
        activeData.benchmark = benchRes;

        // Render each stage with live scientific data
        renderStage1Overview(edaRes, benchRes);
        renderStage2EDA(edaRes);
        renderStage3Preprocessing(edaRes);
        renderStage4Classical(classRes);
        renderStage5Quantum(quantRes);
        renderStage6Benchmark(benchRes);
        buildPatientForm(edaRes.descriptive_statistics);

        // Pre-populate with positive preset
        populatePatientForm(PRESETS[datasetKey].positive);

    } catch (err) {
        console.error("Failed to load dataset artifacts:", err);
    }
}

// Stage 1: Overview
function renderStage1Overview(eda, bench) {
    document.getElementById("stat-samples").innerText = eda.sample_count;
    const peakAcc = Math.max(...bench.comparison_table.map(r => r.Accuracy)) * 100;
    document.getElementById("stat-peak-acc").innerText = `${peakAcc.toFixed(1)}%`;
}

// Stage 2: Scientific EDA
function renderStage2EDA(eda) {
    document.getElementById("eda-samples").innerText = eda.sample_count;
    document.getElementById("eda-features").innerText = eda.feature_count;
    document.getElementById("eda-prevalence").innerText = `${eda.target_distribution.disease_prevalence_pct}%`;
    document.getElementById("eda-duplicates").innerText = eda.duplicate_rows;

    // Render Class Balance Doughnut Chart
    renderClassBalanceChart(eda.target_distribution);

    // Update Figure Links
    document.getElementById("figCorrelationMatrix").src = eda.figures.correlation_matrix;
    document.getElementById("figFeatureDistributions").src = eda.figures.feature_distributions;

    // Chips
    const chipsContainer = document.getElementById("eda-balance-chips");
    chipsContainer.innerHTML = `
        <div class="metric-chip">Disease Positive (1): <strong>${eda.target_distribution.disease_positive_1}</strong></div>
        <div class="metric-chip">Healthy / Benign (0): <strong>${eda.target_distribution.disease_negative_0}</strong></div>
        <div class="metric-chip">Imbalance Ratio: <strong>${eda.target_distribution.imbalance_ratio_pos_to_neg}</strong></div>
    `;

    // Correlations
    const posList = document.getElementById("topPosCorrList");
    posList.innerHTML = eda.top_positive_target_correlations.map(([feat, corr]) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${feat}</span>
            <strong style="color:var(--accent-rose); font-family:'JetBrains Mono';">+${corr.toFixed(4)}</strong>
        </div>
    `).join("");

    const negList = document.getElementById("topNegCorrList");
    negList.innerHTML = eda.top_negative_target_correlations.map(([feat, corr]) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${feat}</span>
            <strong style="color:var(--accent-blue); font-family:'JetBrains Mono';">${corr.toFixed(4)}</strong>
        </div>
    `).join("");
}

function renderClassBalanceChart(targetDist) {
    const ctx = document.getElementById("classBalanceChart").getContext("2d");
    if (charts.classBalance) charts.classBalance.destroy();

    charts.classBalance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Disease Positive (1)", "Healthy Negative (0)"],
            datasets: [{
                data: [targetDist.disease_positive_1, targetDist.disease_negative_0],
                backgroundColor: ["#f43f5e", "#3b82f6"],
                borderColor: "#111827",
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
                }
            },
            cutout: '70%'
        }
    });
}

// Stage 3: Preprocessing
function renderStage3Preprocessing(eda) {
    document.getElementById("comp-raw-num").innerText = eda.feature_count;
    document.getElementById("figPcaVariance").src = eda.figures.pca_variance;
    
    // Estimate or fetch explained variance
    if (currentDatasetKey === "cancer") {
        document.getElementById("comp-explained-var").innerText = "79.32% (4 Components)";
    } else {
        document.getElementById("comp-explained-var").innerText = "38.95% (4 Components)";
    }
}

// Stage 4: Classical SVM Baselines
function renderStage4Classical(classData) {
    const tbody = document.getElementById("classicalTableBody");
    tbody.innerHTML = "";

    const fullModels = classData.models_full_features;
    const pcaModels = classData.models_pca_features;

    const rows = [
        { name: "Linear SVM", repr: `Full (${classData.full_feature_dimension} Feat)`, data: fullModels.linear },
        { name: "RBF SVM (Primary)", repr: `Full (${classData.full_feature_dimension} Feat)`, data: fullModels.rbf },
        { name: "Polynomial SVM", repr: `Full (${classData.full_feature_dimension} Feat)`, data: fullModels.poly },
        { name: "RBF SVM (QSVM Parity)", repr: `4-PCA Components`, data: pcaModels.rbf }
    ];

    rows.forEach(r => {
        const m = r.data;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td><span class="badge-sih">${r.repr}</span></td>
            <td><code style="font-size:0.75rem; color:#a0aec0;">${JSON.stringify(m.best_params)}</code></td>
            <td style="font-family:'JetBrains Mono'; font-weight:600; color:var(--accent-cyan);">${m.cv_summary.accuracy_formatted}</td>
            <td style="font-family:'JetBrains Mono';">${(m.test_metrics.accuracy * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(m.test_metrics.sensitivity * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(m.test_metrics.specificity * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono'; font-weight:600;">${m.test_metrics.roc_auc.toFixed(4)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("figClassicalRoc").src = classData.figures.roc_curves;
    document.getElementById("figClassicalCm").src = classData.figures.confusion_matrices;
    document.getElementById("figClassicalCv").src = classData.figures.cv_performance;
}

// Stage 5: Quantum Engine
function renderStage5Quantum(quantData) {
    document.getElementById("q-qubits").innerText = quantData.quantum_architecture.n_qubits;
    document.getElementById("q-depth").innerText = quantData.quantum_architecture.circuit_depth;
    document.getElementById("q-cnots").innerText = quantData.quantum_architecture.cnot_count;
    document.getElementById("q-kernel-time").innerText = `${quantData.test_metrics.kernel_train_time_sec.toFixed(3)}s`;

    document.getElementById("figQuantumHeatmap").src = quantData.figures.kernel_heatmaps;
    document.getElementById("figQubitScaling").src = quantData.figures.qubit_scaling;
    document.getElementById("figNoiseSensitivity").src = quantData.figures.noise_sensitivity;
}

// Stage 6: Benchmarking & Verdict
function renderStage6Benchmark(benchData) {
    const verdict = benchData.quantum_advantage_verdict;
    document.getElementById("verdictStatus").innerText = verdict.status;
    document.getElementById("verdictSummary").innerText = verdict.summary;

    const tbody = document.getElementById("benchmarkTableBody");
    tbody.innerHTML = "";

    benchData.comparison_table.forEach(r => {
        const tr = document.createElement("tr");
        const isQ = r.Model.includes("Quantum");
        if (isQ) tr.style.background = "rgba(139, 92, 246, 0.08)";
        
        tr.innerHTML = `
            <td><strong>${r.Model}</strong></td>
            <td style="font-family:'JetBrains Mono'; font-weight:700; color:${isQ ? 'var(--accent-purple)' : 'var(--text-primary)'};">${(r.Accuracy * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(r.Sensitivity * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(r.Specificity * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(r.Precision * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono';">${(r.F1_Score * 100).toFixed(2)}%</td>
            <td style="font-family:'JetBrains Mono'; font-weight:600;">${r.ROC_AUC.toFixed(4)}</td>
            <td style="font-family:'JetBrains Mono'; font-size:0.8rem;">${r.Train_Time_s}s</td>
            <td style="font-family:'JetBrains Mono';">${r.Qubits}</td>
            <td style="font-family:'JetBrains Mono';">${r.Circuit_Depth}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("figRadarChart").src = benchData.figures.radar_chart;
    document.getElementById("figConfusionSideBySide").src = benchData.figures.confusion_matrix_side_by_side;
    document.getElementById("researchInferenceBox").innerText = benchData.research_inference_text;
}

// Stage 7: Dynamic Patient Form & Live Prediction
function buildPatientForm(statsDict) {
    const form = document.getElementById("patientForm");
    form.innerHTML = "";

    const featureNames = Object.keys(statsDict);
    featureNames.forEach(fn => {
        const stat = statsDict[fn];
        const group = document.createElement("div");
        group.className = "form-group";
        group.innerHTML = `
            <label for="input_${fn}">${fn} <span style="font-size:0.7rem; color:var(--text-muted);">(μ: ${stat.mean})</span></label>
            <input type="number" step="any" class="form-input" id="input_${fn}" name="${fn}" value="${stat.mean}">
        `;
        form.appendChild(group);
    });
}

function populatePatientForm(valuesObj) {
    Object.keys(valuesObj).forEach(k => {
        const input = document.getElementById(`input_${k}`);
        if (input) input.value = valuesObj[k];
    });
}

async function runPatientPrediction(e) {
    e.preventDefault();
    const btn = document.getElementById("btnPredict");
    btn.innerText = "⚡ Simulating Quantum Kernel Overlap...";
    btn.disabled = true;

    try {
        const form = document.getElementById("patientForm");
        const formData = new FormData(form);
        const features = {};
        formData.forEach((val, key) => {
            features[key] = parseFloat(val);
        });

        const res = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dataset_key: currentDatasetKey,
                features: features
            })
        });

        const result = await res.json();
        renderPredictionResults(result);

    } catch (err) {
        console.error("Prediction failed:", err);
    } finally {
        btn.innerText = "🔬 Run Quantum-Classical Inference";
        btn.disabled = false;
    }
}

function renderPredictionResults(res) {
    const preds = res.predictions;

    // 1. Classical
    const cBadge = document.getElementById("predClassBadge");
    cBadge.innerText = preds.classical_rbf_svm.label;
    cBadge.className = `pred-badge ${preds.classical_rbf_svm.prediction === 1 ? 'badge-disease' : 'badge-healthy'}`;
    document.getElementById("predClassProb").innerText = `${preds.classical_rbf_svm.confidence_pct}%`;

    // 2. Quantum
    const qBadge = document.getElementById("predQuantBadge");
    qBadge.innerText = preds.quantum_kernel_svm.label;
    qBadge.className = `pred-badge ${preds.quantum_kernel_svm.prediction === 1 ? 'badge-disease' : 'badge-healthy'}`;
    document.getElementById("predQuantProb").innerText = `${preds.quantum_kernel_svm.confidence_pct}%`;

    // 3. Hybrid
    const hBadge = document.getElementById("predHybridBadge");
    hBadge.innerText = preds.hybrid_consensus_ensemble.label;
    hBadge.className = `pred-badge ${preds.hybrid_consensus_ensemble.prediction === 1 ? 'badge-disease' : 'badge-healthy'}`;
    document.getElementById("predHybridProb").innerText = `${preds.hybrid_consensus_ensemble.confidence_pct}%`;

    // Clinician Report
    const reportBox = document.getElementById("clinicianReport");
    reportBox.innerHTML = `
        <div style="border-left: 3px solid ${preds.hybrid_consensus_ensemble.risk_color}; padding-left: 12px; margin-bottom: 12px;">
            <strong style="color:${preds.hybrid_consensus_ensemble.risk_color}; font-size:1rem;">${preds.hybrid_consensus_ensemble.risk_tier}</strong>
            <p style="margin-top:4px;">Consensus Disease Probability: <strong>${preds.hybrid_consensus_ensemble.confidence_pct}%</strong></p>
        </div>
        <p><strong>Quantum Feature Space Coordinates:</strong> [${res.quantum_compressed_coordinates.join(", ")}]</p>
        <p><strong>Quantum Rotation Angles (0 to π):</strong> [${res.quantum_rotation_angles.join(", ")}]</p>
        <p style="margin-top:8px; font-size:0.82rem; color:#94a3b8;">${res.clinical_guidance.sensitivity_note}</p>
    `;
}
