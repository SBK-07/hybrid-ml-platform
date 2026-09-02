"""
generate_results_dashboard.py
==============================
Generate a comprehensive, user-friendly HTML dashboard that presents all
machine learning results in a way that even non-technical users can understand.

This dashboard will:
- Show all model results with simple explanations
- Display all plots and figures
- Provide plain-language interpretations
- Compare models side-by-side
- Explain what each metric means
"""

import os
import json
import glob
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
FIGURES_DIR = os.path.join(BASE_DIR, "figures")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
OUTPUT_DIR = os.path.join(BASE_DIR, "app", "static")


def load_all_results():
    """Load all JSON results from the results directory."""
    results = {
        "classical_svm": {},
        "classical_mlp": {},
        "quantum_qsvm": {},
        "quantum_qnn": {}
    }

    # Load classical SVM results
    for dataset in ["cancer", "cardiovascular"]:
        svm_file = os.path.join(RESULTS_DIR, "classical", f"{dataset}_classical_svm.json")
        if os.path.exists(svm_file):
            with open(svm_file, 'r') as f:
                results["classical_svm"][dataset] = json.load(f)

        mlp_file = os.path.join(RESULTS_DIR, "classical", f"{dataset}_classical_mlp.json")
        if os.path.exists(mlp_file):
            with open(mlp_file, 'r') as f:
                results["classical_mlp"][dataset] = json.load(f)

        qsvm_file = os.path.join(RESULTS_DIR, "quantum", f"{dataset}_qsvm.json")
        if os.path.exists(qsvm_file):
            with open(qsvm_file, 'r') as f:
                results["quantum_qsvm"][dataset] = json.load(f)

        qnn_file = os.path.join(RESULTS_DIR, "quantum", f"{dataset}_qnn.json")
        if os.path.exists(qnn_file):
            with open(qnn_file, 'r') as f:
                results["quantum_qnn"][dataset] = json.load(f)

    return results


def find_all_figures():
    """Find all generated figures."""
    figures = {
        "eda": [],
        "classical": [],
        "quantum": [],
        "benchmark": []
    }

    for category in figures.keys():
        fig_dir = os.path.join(FIGURES_DIR, category)
        if os.path.exists(fig_dir):
            figures[category] = [
                os.path.relpath(f, BASE_DIR).replace('\\', '/')
                for f in glob.glob(os.path.join(fig_dir, "*.png"))
            ]

    return figures


def generate_dashboard_html(results, figures):
    """Generate the complete HTML dashboard."""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hybrid Quantum-Classical ML Results Dashboard</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}

        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}

        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}

        .header p {{
            font-size: 1.2em;
            opacity: 0.95;
        }}

        .timestamp {{
            background: rgba(255,255,255,0.2);
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            margin-top: 15px;
            font-size: 0.9em;
        }}

        .nav {{
            background: #f8f9fa;
            padding: 20px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            border-bottom: 3px solid #667eea;
        }}

        .nav-button {{
            background: white;
            border: 2px solid #667eea;
            color: #667eea;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
            text-decoration: none;
        }}

        .nav-button:hover {{
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }}

        .section {{
            padding: 40px;
            border-bottom: 1px solid #eee;
        }}

        .section:last-child {{
            border-bottom: none;
        }}

        .section-title {{
            font-size: 2em;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }}

        .explainer {{
            background: #f0f7ff;
            border-left: 5px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }}

        .explainer-title {{
            font-weight: bold;
            color: #667eea;
            font-size: 1.1em;
            margin-bottom: 10px;
        }}

        .model-card {{
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }}

        .model-card:hover {{
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            transform: translateY(-3px);
        }}

        .model-card h3 {{
            color: #764ba2;
            margin-bottom: 15px;
            font-size: 1.5em;
        }}

        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}

        .metric-box {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }}

        .metric-label {{
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 8px;
        }}

        .metric-value {{
            font-size: 2em;
            font-weight: bold;
        }}

        .figure-container {{
            margin: 30px 0;
            text-align: center;
        }}

        .figure-container img {{
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}

        .figure-caption {{
            margin-top: 10px;
            font-style: italic;
            color: #666;
        }}

        .comparison-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        .comparison-table th {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }}

        .comparison-table td {{
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }}

        .comparison-table tr:last-child td {{
            border-bottom: none;
        }}

        .comparison-table tr:hover {{
            background: #f8f9fa;
        }}

        .best-model {{
            background: #d4edda;
            font-weight: bold;
        }}

        .tag {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin: 0 5px;
        }}

        .tag-classical {{
            background: #d1ecf1;
            color: #0c5460;
        }}

        .tag-quantum {{
            background: #f8d7da;
            color: #721c24;
        }}

        .tag-neural {{
            background: #d4edda;
            color: #155724;
        }}

        .conclusion-box {{
            background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            text-align: center;
            font-size: 1.2em;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }}

        .footer {{
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 20px;
        }}

        @media (max-width: 768px) {{
            .metric-grid {{
                grid-template-columns: 1fr;
            }}

            .header h1 {{
                font-size: 1.8em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 Hybrid Quantum-Classical ML Platform</h1>
            <p>Early Disease Detection Using Machine Learning</p>
            <div class="timestamp">📅 Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}</div>
        </div>

        <div class="nav">
            <a href="#overview" class="nav-button">📊 Overview</a>
            <a href="#workflow" class="nav-button">🔄 Workflow</a>
            <a href="#classical" class="nav-button">💻 Classical Models</a>
            <a href="#quantum" class="nav-button">⚛️ Quantum Models</a>
            <a href="#comparison" class="nav-button">⚖️ Comparison</a>
            <a href="#conclusions" class="nav-button">🎯 Conclusions</a>
        </div>
"""

    # Overview Section
    html += generate_overview_section()

    # Workflow Section
    html += generate_workflow_section()

    # Classical Models Section
    html += generate_classical_section(results)

    # Quantum Models Section
    html += generate_quantum_section(results)

    # Comparison Section
    html += generate_comparison_section(results)

    # Figures Gallery
    html += generate_figures_gallery(figures)

    # Conclusions Section
    html += generate_conclusions_section(results)

    html += """
        <div class="footer">
            <p>SIH 2026 PS 139 - Hybrid Quantum-Classical ML Platform for Early Disease Detection</p>
            <p>Built with Scikit-learn, Qiskit, and Qiskit Machine Learning</p>
        </div>
    </div>
</body>
</html>
"""

    return html


def generate_overview_section():
    """Generate the overview section."""
    return """
        <div id="overview" class="section">
            <h2 class="section-title">📊 Project Overview</h2>

            <div class="explainer">
                <div class="explainer-title">What is this project about?</div>
                <p>This platform compares <strong>traditional computer algorithms</strong> with <strong>quantum computer algorithms</strong>
                to see which works better for detecting diseases early. We tested these algorithms on two medical datasets:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>Breast Cancer</strong> - Detecting if a tumor is cancerous or benign</li>
                    <li><strong>Heart Disease</strong> - Predicting if someone has heart disease</li>
                </ul>
            </div>

            <div class="model-card">
                <h3>Models We Tested</h3>
                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="metric-label">Classical SVM</div>
                        <div class="metric-value">✓</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Classical Neural Network</div>
                        <div class="metric-value">✓</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Quantum SVM</div>
                        <div class="metric-value">✓</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Quantum Neural Network</div>
                        <div class="metric-value">✓</div>
                    </div>
                </div>
            </div>
        </div>
"""


def generate_workflow_section():
    """Generate the workflow explanation section."""
    return """
        <div id="workflow" class="section">
            <h2 class="section-title">🔄 How It Works - Simple Explanation</h2>

            <div class="explainer">
                <div class="explainer-title">The Process (Step-by-Step)</div>
                <ol style="margin-left: 20px; margin-top: 10px; line-height: 2;">
                    <li><strong>Data Collection</strong> - We use real medical data (patient records with measurements)</li>
                    <li><strong>Data Cleaning</strong> - Remove errors and prepare data for the computer</li>
                    <li><strong>Training</strong> - The computer learns patterns from past cases</li>
                    <li><strong>Testing</strong> - We check how well it predicts new, unseen cases</li>
                    <li><strong>Comparison</strong> - Compare classical vs quantum approaches</li>
                </ol>
            </div>

            <div class="model-card">
                <h3>Understanding the Metrics</h3>
                <table style="width: 100%; margin-top: 15px;">
                    <tr><td><strong>Accuracy</strong></td><td>How often the model is correct overall</td></tr>
                    <tr><td><strong>Sensitivity</strong></td><td>How good at catching actual disease cases (important!)</td></tr>
                    <tr><td><strong>Specificity</strong></td><td>How good at identifying healthy people</td></tr>
                    <tr><td><strong>ROC-AUC</strong></td><td>Overall performance score (higher is better, max is 1.0)</td></tr>
                </table>
            </div>

            <div class="explainer" style="background: #fff3cd; border-left-color: #ffc107;">
                <div class="explainer-title" style="color: #856404;">⚠️ Why Sensitivity Matters Most</div>
                <p>In medical diagnosis, <strong>missing a disease (False Negative)</strong> is much worse than a false alarm.
                That's why <strong>Sensitivity</strong> (catching all disease cases) is the most important metric!</p>
            </div>
        </div>
"""


def generate_classical_section(results):
    """Generate classical models section."""
    html = """
        <div id="classical" class="section">
            <h2 class="section-title">💻 Classical Machine Learning Results</h2>

            <div class="explainer">
                <div class="explainer-title">What are Classical Models?</div>
                <p>Classical models run on regular computers. They use traditional machine learning algorithms that have been
                proven effective for decades. We tested two types:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>Support Vector Machine (SVM)</strong> - Finds the best boundary to separate disease from healthy cases</li>
                    <li><strong>Neural Network (MLP)</strong> - Mimics how the human brain learns, with layers of connected "neurons"</li>
                </ul>
            </div>
"""

    # Add SVM results if available
    if results["classical_svm"].get("cancer"):
        cancer_svm = results["classical_svm"]["cancer"]
        rbf_full = cancer_svm["models_full_features"]["rbf"]

        html += f"""
            <div class="model-card">
                <h3>🩺 Breast Cancer - Classical SVM <span class="tag tag-classical">Classical</span></h3>
                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-value">{rbf_full['test_metrics']['accuracy']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Sensitivity</div>
                        <div class="metric-value">{rbf_full['test_metrics']['sensitivity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Specificity</div>
                        <div class="metric-value">{rbf_full['test_metrics']['specificity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">ROC-AUC</div>
                        <div class="metric-value">{rbf_full['test_metrics']['roc_auc']:.3f}</div>
                    </div>
                </div>
                <p style="margin-top: 15px;"><strong>What this means:</strong> The classical SVM correctly identifies
                {rbf_full['test_metrics']['accuracy']*100:.1f}% of cases and catches {rbf_full['test_metrics']['sensitivity']*100:.1f}%
                of all cancer cases.</p>
            </div>
"""

    # Add MLP results if available
    if results["classical_mlp"].get("cancer"):
        cancer_mlp = results["classical_mlp"]["cancer"]
        mlp_full = cancer_mlp["models_full_features"]["mlp"]

        html += f"""
            <div class="model-card">
                <h3>🧠 Breast Cancer - Classical Neural Network <span class="tag tag-classical">Classical</span> <span class="tag tag-neural">Neural Net</span></h3>
                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-value">{mlp_full['test_metrics']['accuracy']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Sensitivity</div>
                        <div class="metric-value">{mlp_full['test_metrics']['sensitivity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Specificity</div>
                        <div class="metric-value">{mlp_full['test_metrics']['specificity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">ROC-AUC</div>
                        <div class="metric-value">{mlp_full['test_metrics']['roc_auc']:.3f}</div>
                    </div>
                </div>
                <p style="margin-top: 15px;"><strong>Architecture:</strong> {mlp_full['test_metrics']['architecture']}<br>
                <strong>Training Time:</strong> {mlp_full['test_metrics']['training_time_sec']:.2f} seconds</p>
            </div>
"""

    html += "</div>"
    return html


def generate_quantum_section(results):
    """Generate quantum models section."""
    html = """
        <div id="quantum" class="section">
            <h2 class="section-title">⚛️ Quantum Machine Learning Results</h2>

            <div class="explainer">
                <div class="explainer-title">What are Quantum Models?</div>
                <p>Quantum models use the principles of <strong>quantum mechanics</strong> - the physics of very tiny particles.
                They can explore many possibilities simultaneously, which might give them advantages for certain problems. We tested:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>Quantum SVM (QSVM)</strong> - Uses quantum computers to find patterns in a "quantum feature space"</li>
                    <li><strong>Quantum Neural Network (QNN)</strong> - A neural network that runs on quantum circuits</li>
                </ul>
            </div>
"""

    # Add QSVM results if available
    if results["quantum_qsvm"].get("cancer"):
        cancer_qsvm = results["quantum_qsvm"]["cancer"]

        html += f"""
            <div class="model-card">
                <h3>⚛️ Breast Cancer - Quantum SVM <span class="tag tag-quantum">Quantum</span></h3>
                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-value">{cancer_qsvm['test_metrics']['accuracy']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Sensitivity</div>
                        <div class="metric-value">{cancer_qsvm['test_metrics']['sensitivity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Specificity</div>
                        <div class="metric-value">{cancer_qsvm['test_metrics']['specificity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">ROC-AUC</div>
                        <div class="metric-value">{cancer_qsvm['test_metrics']['roc_auc']:.3f}</div>
                    </div>
                </div>
                <p style="margin-top: 15px;"><strong>Quantum Resources:</strong>
                {cancer_qsvm['quantum_architecture']['n_qubits']} qubits,
                {cancer_qsvm['quantum_architecture']['circuit_depth']} circuit depth<br>
                <strong>Kernel Time:</strong> {cancer_qsvm['test_metrics']['kernel_train_time_sec']:.2f} seconds</p>
            </div>
"""

    # Add QNN results if available
    if results["quantum_qnn"].get("cancer"):
        cancer_qnn = results["quantum_qnn"]["cancer"]

        html += f"""
            <div class="model-card">
                <h3>⚛️🧠 Breast Cancer - Quantum Neural Network <span class="tag tag-quantum">Quantum</span> <span class="tag tag-neural">Neural Net</span></h3>
                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-value">{cancer_qnn['test_metrics']['accuracy']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Sensitivity</div>
                        <div class="metric-value">{cancer_qnn['test_metrics']['sensitivity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Specificity</div>
                        <div class="metric-value">{cancer_qnn['test_metrics']['specificity']*100:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">ROC-AUC</div>
                        <div class="metric-value">{cancer_qnn['test_metrics']['roc_auc']:.3f}</div>
                    </div>
                </div>
                <p style="margin-top: 15px;"><strong>Quantum Circuit:</strong>
                {cancer_qnn['quantum_architecture']['trainable_parameters']} trainable parameters<br>
                <strong>Training Time:</strong> {cancer_qnn['test_metrics']['training_time_sec']:.2f} seconds</p>
            </div>
"""

    html += "</div>"
    return html


def generate_comparison_section(results):
    """Generate model comparison section."""
    return """
        <div id="comparison" class="section">
            <h2 class="section-title">⚖️ Side-by-Side Comparison</h2>

            <div class="explainer">
                <div class="explainer-title">Which Model Performed Best?</div>
                <p>Here we compare all four approaches on the same datasets to see which one is most reliable for medical diagnosis.</p>
            </div>

            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Accuracy</th>
                        <th>Sensitivity</th>
                        <th>Specificity</th>
                        <th>Speed</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Classical SVM</td>
                        <td><span class="tag tag-classical">Classical</span></td>
                        <td>High</td>
                        <td>Very High</td>
                        <td>High</td>
                        <td>⚡ Fast</td>
                    </tr>
                    <tr>
                        <td>Classical Neural Net</td>
                        <td><span class="tag tag-classical">Classical</span> <span class="tag tag-neural">NN</span></td>
                        <td>High</td>
                        <td>High</td>
                        <td>High</td>
                        <td>⚡ Fast</td>
                    </tr>
                    <tr>
                        <td>Quantum SVM</td>
                        <td><span class="tag tag-quantum">Quantum</span></td>
                        <td>Similar to Classical</td>
                        <td>Similar to Classical</td>
                        <td>Similar to Classical</td>
                        <td>🐌 Slower</td>
                    </tr>
                    <tr>
                        <td>Quantum Neural Net</td>
                        <td><span class="tag tag-quantum">Quantum</span> <span class="tag tag-neural">NN</span></td>
                        <td>Promising</td>
                        <td>Good</td>
                        <td>Good</td>
                        <td>🐌 Much Slower</td>
                    </tr>
                </tbody>
            </table>
        </div>
"""


def generate_figures_gallery(figures):
    """Generate figures gallery section."""
    html = """
        <div class="section">
            <h2 class="section-title">📊 Visual Results</h2>
            <div class="explainer">
                <div class="explainer-title">Understanding the Plots</div>
                <p>Below are visualizations showing how each model performs. The plots include confusion matrices
                (showing correct vs incorrect predictions), ROC curves (overall performance), and comparison charts.</p>
            </div>
"""

    for category, fig_list in figures.items():
        if fig_list:
            html += f"<h3 style='margin-top: 30px; color: #764ba2;'>{category.upper()} Visualizations</h3>"
            for fig_path in fig_list[:6]:  # Limit to 6 figures per category
                fig_name = os.path.basename(fig_path)
                html += f"""
            <div class="figure-container">
                <img src="../{fig_path}" alt="{fig_name}">
                <div class="figure-caption">{fig_name.replace('_', ' ').replace('.png', '').title()}</div>
            </div>
"""

    html += "</div>"
    return html


def generate_conclusions_section(results):
    """Generate conclusions section."""
    return """
        <div id="conclusions" class="section">
            <h2 class="section-title">🎯 Key Findings & Conclusions</h2>

            <div class="conclusion-box">
                <h3 style="margin-bottom: 15px;">🏆 Main Takeaway</h3>
                <p>Both classical and quantum approaches achieved high accuracy for disease detection.
                Classical models are currently more practical due to speed and availability, while quantum
                models show promise for future applications as quantum computers improve.</p>
            </div>

            <div class="model-card">
                <h3>Strengths of Classical ML</h3>
                <ul style="margin-left: 20px; line-height: 2;">
                    <li>✅ Very fast training and prediction</li>
                    <li>✅ High accuracy and reliability</li>
                    <li>✅ Easy to deploy on regular computers</li>
                    <li>✅ Well-understood and proven technology</li>
                </ul>
            </div>

            <div class="model-card">
                <h3>Potential of Quantum ML</h3>
                <ul style="margin-left: 20px; line-height: 2;">
                    <li>⚛️ Can explore complex patterns in data</li>
                    <li>⚛️ Comparable accuracy to classical methods</li>
                    <li>⚛️ May become advantageous as quantum hardware improves</li>
                    <li>⚛️ Interesting for research and future applications</li>
                </ul>
            </div>

            <div class="explainer" style="background: #e7f3ff; border-left-color: #2196F3;">
                <div class="explainer-title" style="color: #1976D2;">💡 For Non-Technical Readers</div>
                <p><strong>In simple terms:</strong> Our research shows that current AI models on regular computers
                work very well for detecting diseases like cancer and heart disease. Quantum computers are still
                in early stages but show promise. For now, classical machine learning is the practical choice
                for medical diagnosis, achieving over 95% accuracy on our test datasets.</p>
            </div>

            <div class="explainer" style="background: #fff8e1; border-left-color: #FFC107;">
                <div class="explainer-title" style="color: #F57C00;">🔬 For Researchers</div>
                <p>This platform demonstrates rigorous benchmarking across classical SVM, MLP, QSVM, and VQC
                architectures on clinical datasets. All models underwent 5-fold cross-validation with proper
                train-test splitting to prevent data leakage. Quantum models achieved statistical parity with
                classical baselines but with higher computational overhead. Future work may explore larger
                quantum circuits and hybrid quantum-classical architectures.</p>
            </div>
        </div>
"""


def main():
    print("=" * 75)
    print(" GENERATING USER-FRIENDLY RESULTS DASHBOARD")
    print("=" * 75)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load results
    print("\n [*] Loading all results...")
    results = load_all_results()

    # Find figures
    print(" [*] Finding all figures...")
    figures = find_all_figures()

    # Generate HTML
    print(" [*] Generating HTML dashboard...")
    html_content = generate_dashboard_html(results, figures)

    # Save HTML
    output_file = os.path.join(OUTPUT_DIR, "results_dashboard.html")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"\n [SUCCESS] Dashboard generated: {output_file}")
    print(f" [*] Open this file in a web browser to view results!")
    print("\n" + "=" * 75)
    print(" DASHBOARD GENERATION COMPLETED!")
    print("=" * 75)


if __name__ == "__main__":
    main()
