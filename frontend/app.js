const API_BASE = "http://localhost:8000/api";

// Application State
let currentDataset = "heart.csv";
let datasetsList = [];
let charts = {};

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initDatasetSelector();
    fetchDatasets();
    loadDatasetData(currentDataset);
});

// 1. Navigation Switching
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

    // Buttons actions
    document.getElementById("btnRunPreprocess").addEventListener("click", runPreprocessPipeline);
    document.getElementById("btnTrainModels").addEventListener("click", trainModelsPipeline);
    document.getElementById("btnPredict").addEventListener("click", runPatientPrediction);
}

// 2. Dataset Management
function initDatasetSelector() {
    const select = document.getElementById("datasetSelect");
    select.addEventListener("change", (e) => {
        currentDataset = e.target.value;
        loadDatasetData(currentDataset);
    });
}

async function fetchDatasets() {
    try {
        const res = await fetch(`${API_BASE}/datasets`);
        const data = await res.json();
        datasetsList = data.datasets;
    } catch (err) {
        console.error("Failed to fetch datasets:", err);
    }
}

async function loadDatasetData(datasetId) {
    try {
        const res = await fetch(`${API_BASE}/preprocess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_id: datasetId, n_qubits: 4, apply_smote: false })
        });
        const data = await res.json();
        
        // Update Stage 2 Ingestion Stats & Table Preview
        document.getElementById("ingest-rows").innerText = data.original_stats.num_samples;
        document.getElementById("ingest-cols").innerText = data.original_stats.num_features;
        document.getElementById("ingest-target").innerText = data.feature_names[data.feature_names.length - 1] || "target";
        
        renderPreviewTable(data.sample_preview);
        renderClassBalanceChart(data.original_stats.class_distribution);
        buildPatientForm(data.feature_names, data.sample_preview[0]);
    } catch (err) {
        console.error("Error loading dataset:", err);
    }
}

function renderPreviewTable(records) {
    const table = document.getElementById("previewTable");
    if (!records || records.length === 0) return;

    const keys = Object.keys(records[0]);
    let html = "<thead><tr>" + keys.map(k => `<th>${k}</th>`).join("") + "</tr></thead><tbody>";
    records.forEach(r => {
        html += "<tr>" + keys.map(k => `<td>${r[k]}</td>`).join("") + "</tr>";
    });
    html += "tbody";
    table.innerHTML = html;
}

function renderClassBalanceChart(dist) {
    const ctx = document.getElementById("classBalanceChart").getContext("2d");
    if (charts.classBalance) charts.classBalance.destroy();

    const labels = Object.keys(dist).map(k => k === "1" ? "Positive (Disease)" : "Negative (Healthy)");
    const values = Object.values(dist);

    charts.classBalance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ["#10b981", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: "#9ca3af" } } }
        }
    });
}

// 3. Preprocessing & PCA Scatter Plot
async function runPreprocessPipeline() {
    const btn = document.getElementById("btnRunPreprocess");
    btn.innerText = "⏳ Processing...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/preprocess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_id: currentDataset, n_qubits: 4, apply_smote: true })
        });
        const data = await res.json();
        
        document.getElementById("comp-before").innerText = data.original_stats.num_features;
        document.getElementById("comp-after").innerText = data.processed_stats.num_features_compressed;
        document.getElementById("explainedVar").innerText = `${(data.processed_stats.total_explained_variance * 100).toFixed(1)}%`;
        
        renderPcaScatterPlot(data.processed_stats.scatter_2d);
    } catch (err) {
        console.error("Preprocessing error:", err);
    } finally {
        btn.innerText = "⚡ Run Compression Pipeline";
        btn.disabled = false;
    }
}

function renderPcaScatterPlot(points) {
    const ctx = document.getElementById("pcaScatterChart").getContext("2d");
    if (charts.pcaScatter) charts.pcaScatter.destroy();

    const pos = points.filter(p => p.label === 1).map(p => ({ x: p.x, y: p.y }));
    const neg = points.filter(p => p.label === 0).map(p => ({ x: p.x, y: p.y }));

    charts.pcaScatter = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                { label: "Healthy (0)", data: neg, backgroundColor: "#10b981" },
                { label: "Disease Risk (1)", data: pos, backgroundColor: "#ef4444" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } },
                y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } }
            },
            plugins: { legend: { labels: { color: "#9ca3af" } } }
        }
    });
}

// 4. Hybrid Model Training Pipeline
async function trainModelsPipeline() {
    const btn = document.getElementById("btnTrainModels");
    const pBox = document.getElementById("trainProgressBox");
    const pBar = document.getElementById("trainProgressBar");
    
    btn.disabled = true;
    pBox.classList.remove("hidden");
    pBar.style.width = "30%";

    try {
        pBar.style.width = "60%";
        const res = await fetch(`${API_BASE}/train`, { method: "POST" });
        const data = await res.json();
        pBar.style.width = "100%";

        setTimeout(() => pBox.classList.add("hidden"), 800);

        renderBenchmarkTable(data.benchmark_table);
        renderBenchmarkChart(data.benchmark_table);
        document.getElementById("realityCheckTxt").innerText = `${data.reality_check.backend} with ${data.reality_check.qubit_count} qubits using ${data.reality_check.encoding}. ${data.reality_check.limitation_note}`;
        
        // Auto-fetch SHAP explainability
        fetchExplainability();
    } catch (err) {
        console.error("Training error:", err);
    } finally {
        btn.disabled = false;
    }
}

// 5. Benchmarking Matrix Rendering
function renderBenchmarkTable(tableData) {
    const tbody = document.querySelector("#benchmarkTable tbody");
    let html = "";
    tableData.forEach(row => {
        const catBadge = row.category === "Quantum" ? `<span style="color:#00f2fe;font-weight:700;">Quantum</span>` : 
                         row.category === "Hybrid" ? `<span style="color:#ec4899;font-weight:700;">Hybrid</span>` : row.category;
        
        html += `<tr>
            <td><strong>${row.model}</strong></td>
            <td>${catBadge}</td>
            <td><span style="color:#10b981;font-weight:700;">${row.accuracy}%</span></td>
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
    const ctx = document.getElementById("benchmarkBarChart").getContext("2d");
    if (charts.benchmark) charts.benchmark.destroy();

    const labels = tableData.map(r => r.model);
    const accs = tableData.map(r => r.accuracy);
    const aucs = tableData.map(r => r.auc_roc * 100);

    charts.benchmark = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                { label: "Accuracy (%)", data: accs, backgroundColor: "#00f2fe" },
                { label: "AUC-ROC (%)", data: aucs, backgroundColor: "#8b5cf6" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } },
                y: { min: 40, max: 100, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } }
            },
            plugins: { legend: { labels: { color: "#9ca3af" } } }
        }
    });
}

// 6. SHAP Explainability
async function fetchExplainability() {
    try {
        const res = await fetch(`${API_BASE}/explain`);
        const data = await res.json();
        renderShapChart(data.feature_importances);
    } catch (err) {
        console.error("Explainability error:", err);
    }
}

function renderShapChart(importances) {
    const ctx = document.getElementById("shapBarChart").getContext("2d");
    if (charts.shap) charts.shap.destroy();

    const labels = importances.map(i => i.feature);
    const values = importances.map(i => i.importance);

    charts.shap = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "SHAP Feature Attribution (%)",
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
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } },
                y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } }
            },
            plugins: { legend: { labels: { color: "#9ca3af" } } }
        }
    });
}

// 7. Live Patient Prediction Form
function buildPatientForm(featureNames, sampleRow) {
    const form = document.getElementById("patientForm");
    let html = "";
    featureNames.forEach(feat => {
        const defaultVal = sampleRow ? (sampleRow[feat] || 0) : 0;
        html += `<div class="form-group">
            <label>${feat}</label>
            <input type="number" step="any" name="${feat}" value="${defaultVal}">
        </div>`;
    });
    form.innerHTML = html;
}

async function runPatientPrediction() {
    const form = document.getElementById("patientForm");
    const formData = new FormData(form);
    const patientData = {};
    formData.forEach((val, key) => patientData[key] = parseFloat(val));

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
    }
}

function renderPredictionCards(preds) {
    const container = document.getElementById("predictionCards");
    let html = "";
    for (const [modelName, pdict] of Object.entries(preds)) {
        const badgeClass = pdict.label === 1 ? "badge-positive" : "badge-negative";
        const labelText = pdict.label === 1 ? "High Risk (1)" : "Healthy (0)";
        const isHighlight = modelName.includes("Hybrid") ? "highlight" : "";

        html += `<div class="pred-card ${isHighlight}">
            <div class="pred-title">${modelName}</div>
            <div class="pred-badge ${badgeClass}">${labelText}</div>
            <div style="font-size:0.85rem;margin-top:4px;">Risk: <strong>${(pdict.probability*100).toFixed(1)}%</strong></div>
            <div style="font-size:0.75rem;color:#9ca3af;">Conf: ${pdict.confidence}</div>
        </div>`;
    }
    container.innerHTML = html;
}
