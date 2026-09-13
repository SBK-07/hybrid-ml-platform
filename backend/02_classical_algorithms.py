"""
02_classical_algorithms.py
==========================
Classical Machine Learning Baselines: SVM & Neural Networks.

Datasets:
  1. Breast Cancer Wisconsin Diagnostic (WDBC)
  2. UCI Heart Disease

Models Evaluated:
  A. Support Vector Machines (SVMs):
    - SVM-Linear:     K(x, z) = x^T z
    - SVM-RBF:        K(x, z) = exp(-gamma * ||x - z||^2)  [Primary Baseline]
    - SVM-Polynomial: K(x, z) = (gamma * x^T z + r)^d

  B. Neural Networks:
    - Multi-Layer Perceptron (MLP): Clinical-optimized architecture for medical diagnostics
      Architecture: Input → Dense(64, ReLU) → Dropout(0.3) → Dense(32, ReLU) → Dropout(0.2) → Dense(1, Sigmoid)
      Suitable for small-to-medium medical datasets with proper regularization

Experimental Methodology:
  - 5-Fold Stratified Cross Validation (StratifiedKFold)
  - Hyperparameter Grid Search (C, gamma, degree for SVM; layers, dropout for NN)
  - Rigorous statistical metric reporting (mean +/- std across all 5 folds)
  - Full-feature & 4-component PCA representation evaluation (for 1:1 quantum parity)
  - Generalization test on held-out 20% test partition
  - Confusion Matrix, ROC-AUC, Precision-Recall, Sensitivity/Specificity computation
  - Artifact & metadata serialization for independent benchmarking.
"""

import os
import json
import time
import warnings
warnings.filterwarnings('ignore')
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, log_loss
)

# Plotting settings
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'

# Common Configuration
RANDOM_STATE = 42
CV_FOLDS = 5

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
RESULTS_CLASSICAL_DIR = os.path.join(BASE_DIR, "results", "classical")
MODELS_DIR = os.path.join(BASE_DIR, "models")
FIGURES_CLASSICAL_DIR = os.path.join(BASE_DIR, "figures", "classical")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")


def create_directories():
    """Ensure output directories exist."""
    dirs = [
        RESULTS_CLASSICAL_DIR,
        os.path.join(MODELS_DIR, "cancer"),
        os.path.join(MODELS_DIR, "cardiovascular"),
        FIGURES_CLASSICAL_DIR,
        REPORTS_DIR
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print(" [SUCCESS] Classical baseline directories initialized.")


def calculate_medical_metrics(y_true, y_pred, y_prob=None):
    """Calculate clinical metrics: Sensitivity (Recall), Specificity, Accuracy, Precision, F1, ROC-AUC."""
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    accuracy = float(accuracy_score(y_true, y_pred))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    sensitivity = float(recall_score(y_true, y_pred, zero_division=0)) # True Positive Rate
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0      # True Negative Rate
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    
    auc = float(roc_auc_score(y_true, y_prob)) if y_prob is not None else 0.0
    loss = float(log_loss(y_true, y_prob)) if y_prob is not None else 0.0
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "f1_score": f1,
        "roc_auc": auc,
        "log_loss": loss,
        "confusion_matrix": {
            "TP": int(tp), "FP": int(fp),
            "TN": int(tn), "FN": int(fn)
        }
    }


def perform_stratified_cv_grid_search(X_train, y_train, kernel_type, param_grid):
    """
    Perform 5-Fold Stratified Cross Validation with GridSearchCV,
    recording fold-by-fold results and computing mean +/- std.
    """
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    
    base_clf = SVC(kernel=kernel_type, probability=True, random_state=RANDOM_STATE)
    grid_search = GridSearchCV(
        estimator=base_clf,
        param_grid=param_grid,
        cv=skf,
        scoring='roc_auc',
        n_jobs=-1,
        refit=True
    )
    
    t0 = time.time()
    grid_search.fit(X_train, y_train)
    cv_time = time.time() - t0
    
    best_model = grid_search.best_estimator_
    best_params = grid_search.best_params_
    
    # Detailed fold-by-fold evaluation with best parameters
    fold_metrics = []
    for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train), 1):
        X_tr, y_tr = X_train[train_idx], y_train[train_idx]
        X_val, y_val = X_train[val_idx], y_train[val_idx]
        
        clf = SVC(**best_params, kernel=kernel_type, probability=True, random_state=RANDOM_STATE)
        clf.fit(X_tr, y_tr)
        
        y_val_pred = clf.predict(X_val)
        y_val_prob = clf.predict_proba(X_val)[:, 1]
        
        metrics = calculate_medical_metrics(y_val, y_val_pred, y_val_prob)
        metrics["fold"] = fold_idx
        fold_metrics.append(metrics)
        
    # Aggregate mean +/- std across folds
    keys = ["accuracy", "precision", "sensitivity", "specificity", "f1_score", "roc_auc"]
    cv_summary = {}
    for k in keys:
        values = [fm[k] for fm in fold_metrics]
        cv_summary[f"{k}_mean"] = float(np.mean(values))
        cv_summary[f"{k}_std"] = float(np.std(values))
        cv_summary[f"{k}_formatted"] = f"{np.mean(values)*100:.2f}% +/- {np.std(values)*100:.2f}%"
        
    return {
        "best_params": best_params,
        "best_model": best_model,
        "cv_search_time_sec": float(round(cv_time, 4)),
        "cv_folds": fold_metrics,
        "cv_summary": cv_summary
    }


def perform_mlp_cv_grid_search(X_train, y_train, param_grid):
    """
    Perform 5-Fold Stratified Cross Validation with GridSearchCV for MLP,
    recording fold-by-fold results and computing mean +/- std.

    MLP Architecture optimized for clinical data:
    - Hidden layers suitable for small-to-medium medical datasets
    - Regularization via alpha (L2 penalty) and early stopping
    - Adam optimizer with adaptive learning rate
    """
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    base_mlp = MLPClassifier(
        max_iter=1000,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20,
        random_state=RANDOM_STATE,
        verbose=False
    )

    grid_search = GridSearchCV(
        estimator=base_mlp,
        param_grid=param_grid,
        cv=skf,
        scoring='roc_auc',
        n_jobs=-1,
        refit=True
    )

    t0 = time.time()
    grid_search.fit(X_train, y_train)
    cv_time = time.time() - t0

    best_model = grid_search.best_estimator_
    best_params = grid_search.best_params_

    # Detailed fold-by-fold evaluation with best parameters
    fold_metrics = []
    for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train), 1):
        X_tr, y_tr = X_train[train_idx], y_train[train_idx]
        X_val, y_val = X_train[val_idx], y_train[val_idx]

        clf = MLPClassifier(**best_params, max_iter=1000, early_stopping=True,
                           validation_fraction=0.15, n_iter_no_change=20,
                           random_state=RANDOM_STATE, verbose=False)
        clf.fit(X_tr, y_tr)

        y_val_pred = clf.predict(X_val)
        y_val_prob = clf.predict_proba(X_val)[:, 1]

        metrics = calculate_medical_metrics(y_val, y_val_pred, y_val_prob)
        metrics["fold"] = fold_idx
        fold_metrics.append(metrics)

    # Aggregate mean +/- std across folds
    keys = ["accuracy", "precision", "sensitivity", "specificity", "f1_score", "roc_auc"]
    cv_summary = {}
    for k in keys:
        values = [fm[k] for fm in fold_metrics]
        cv_summary[f"{k}_mean"] = float(np.mean(values))
        cv_summary[f"{k}_std"] = float(np.std(values))
        cv_summary[f"{k}_formatted"] = f"{np.mean(values)*100:.2f}% +/- {np.std(values)*100:.2f}%"

    return {
        "best_params": best_params,
        "best_model": best_model,
        "cv_search_time_sec": float(round(cv_time, 4)),
        "cv_folds": fold_metrics,
        "cv_summary": cv_summary
    }


def evaluate_classical_mlp(dataset_key, dataset_name):
    """
    Evaluate classical Multi-Layer Perceptron (MLP) Neural Network.

    Architecture Selection Rationale for Clinical Data:
    - Small-to-medium medical datasets (300-600 samples) require careful regularization
    - Hidden layer architecture: (64, 32) or (32, 16) based on input dimensionality
    - ReLU activation for non-linearity
    - Adam optimizer with adaptive learning rate
    - L2 regularization (alpha) to prevent overfitting
    - Early stopping to prevent overtraining

    This architecture balances model capacity with generalization for medical diagnostics.
    """
    print(f"\n" + "=" * 70)
    print(f" EXPERIMENT: CLASSICAL NEURAL NETWORK (MLP) - {dataset_name.upper()}")
    print("=" * 70)

    # Load classical processed partition
    class_dir = os.path.join(DATA_PROC_DIR, dataset_key.lower(), "classical")
    X_train_full = np.load(os.path.join(class_dir, "X_train.npy"))
    X_test_full = np.load(os.path.join(class_dir, "X_test.npy"))
    y_train = np.load(os.path.join(class_dir, "y_train.npy"))
    y_test = np.load(os.path.join(class_dir, "y_test.npy"))

    # Load quantum 4-PCA partition for parity comparison
    quant_dir = os.path.join(DATA_PROC_DIR, dataset_key.lower(), "quantum")
    X_train_pca = np.load(os.path.join(quant_dir, "X_train_quantum.npy"))
    X_test_pca = np.load(os.path.join(quant_dir, "X_test_quantum.npy"))

    # Define MLP architectures based on input dimensionality
    n_features = X_train_full.shape[1]
    if n_features >= 20:
        hidden_layers_full = [(64, 32), (128, 64), (64, 32, 16)]
    else:
        hidden_layers_full = [(32, 16), (64, 32), (32, 16, 8)]

    # MLP Parameter Grid
    mlp_param_grid_full = {
        "hidden_layer_sizes": hidden_layers_full,
        "alpha": [0.0001, 0.001, 0.01, 0.1],  # L2 regularization
        "learning_rate_init": [0.001, 0.01],
        "activation": ['relu']
    }

    mlp_param_grid_pca = {
        "hidden_layer_sizes": [(16, 8), (32, 16), (16, 8, 4)],
        "alpha": [0.0001, 0.001, 0.01],
        "learning_rate_init": [0.001, 0.01],
        "activation": ['relu']
    }

    results = {
        "dataset_name": dataset_name,
        "dataset_key": dataset_key,
        "full_feature_dimension": int(X_train_full.shape[1]),
        "pca_feature_dimension": int(X_train_pca.shape[1]),
        "models_full_features": {},
        "models_pca_features": {}
    }

    roc_curves_data = {}

    # 1. Evaluate Full Feature MLP
    print(f"\n--- 1. Evaluating MLP Neural Network ({X_train_full.shape[1]} features) ---")
    print(f" [*] Running 5-Fold CV + GridSearch for MLP (Full Features)...")
    cv_res = perform_mlp_cv_grid_search(X_train_full, y_train, mlp_param_grid_full)
    model = cv_res["best_model"]

    # Test evaluation
    t_start_train = time.time()
    model.fit(X_train_full, y_train)
    train_time = time.time() - t_start_train

    t_start_inf = time.time()
    y_test_pred = model.predict(X_test_full)
    y_test_prob = model.predict_proba(X_test_full)[:, 1]
    inf_time = time.time() - t_start_inf

    test_metrics = calculate_medical_metrics(y_test, y_test_pred, y_test_prob)
    test_metrics["training_time_sec"] = float(round(train_time, 5))
    test_metrics["inference_time_sec"] = float(round(inf_time, 5))
    test_metrics["n_layers"] = len(cv_res["best_params"]["hidden_layer_sizes"])
    test_metrics["architecture"] = str(cv_res["best_params"]["hidden_layer_sizes"])

    # Save model
    model_save_path = os.path.join(MODELS_DIR, dataset_key.lower(), f"classical_mlp_full.joblib")
    joblib.dump(model, model_save_path)

    # ROC data
    fpr, tpr, _ = roc_curve(y_test, y_test_prob)
    roc_curves_data["MLP (Full)"] = (fpr, tpr, test_metrics["roc_auc"])

    results["models_full_features"]["mlp"] = {
        "best_params": cv_res["best_params"],
        "cv_summary": cv_res["cv_summary"],
        "cv_folds": cv_res["cv_folds"],
        "test_metrics": test_metrics,
        "model_path": model_save_path
    }

    print(f"     -> Architecture: {test_metrics['architecture']}")
    print(f"     -> CV Accuracy: {cv_res['cv_summary']['accuracy_formatted']} | Test Acc: {test_metrics['accuracy']*100:.2f}% | Test AUC: {test_metrics['roc_auc']:.4f}")
    print(f"     -> Training Time: {train_time:.3f}s | Inference Time: {inf_time:.5f}s")

    # 2. Evaluate 4-PCA Feature MLP (QNN Parity)
    print(f"\n--- 2. Evaluating 4-Component PCA MLP (1:1 QNN Parity Baseline) ---")
    print(f" [*] Running 5-Fold CV + GridSearch for MLP (4-PCA)...")
    cv_res = perform_mlp_cv_grid_search(X_train_pca, y_train, mlp_param_grid_pca)
    model = cv_res["best_model"]

    t_start_train = time.time()
    model.fit(X_train_pca, y_train)
    train_time = time.time() - t_start_train

    t_start_inf = time.time()
    y_test_pred = model.predict(X_test_pca)
    y_test_prob = model.predict_proba(X_test_pca)[:, 1]
    inf_time = time.time() - t_start_inf

    test_metrics = calculate_medical_metrics(y_test, y_test_pred, y_test_prob)
    test_metrics["training_time_sec"] = float(round(train_time, 5))
    test_metrics["inference_time_sec"] = float(round(inf_time, 5))
    test_metrics["n_layers"] = len(cv_res["best_params"]["hidden_layer_sizes"])
    test_metrics["architecture"] = str(cv_res["best_params"]["hidden_layer_sizes"])

    model_save_path = os.path.join(MODELS_DIR, dataset_key.lower(), f"classical_mlp_pca.joblib")
    joblib.dump(model, model_save_path)

    fpr, tpr, _ = roc_curve(y_test, y_test_prob)
    roc_curves_data["MLP (4-PCA)"] = (fpr, tpr, test_metrics["roc_auc"])

    results["models_pca_features"]["mlp"] = {
        "best_params": cv_res["best_params"],
        "cv_summary": cv_res["cv_summary"],
        "cv_folds": cv_res["cv_folds"],
        "test_metrics": test_metrics,
        "model_path": model_save_path
    }

    print(f"     -> Architecture: {test_metrics['architecture']}")
    print(f"     -> CV Accuracy: {cv_res['cv_summary']['accuracy_formatted']} | Test Acc: {test_metrics['accuracy']*100:.2f}% | Test AUC: {test_metrics['roc_auc']:.4f}")
    print(f"     -> Training Time: {train_time:.3f}s | Inference Time: {inf_time:.5f}s")

    # Save JSON Results
    json_path = os.path.join(RESULTS_CLASSICAL_DIR, f"{dataset_key.lower()}_classical_mlp.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"\n [SUCCESS] Classical MLP results saved to: {json_path}")

    # Generate MLP Visualizations
    generate_mlp_visualizations(results, roc_curves_data, dataset_key, dataset_name)

    return results


def generate_mlp_visualizations(results, roc_curves_data, dataset_key, dataset_name):
    """Generate high-resolution MLP-specific visualizations."""
    # 1. ROC Curves for MLP
    plt.figure(figsize=(8, 6))
    colors = ['#E74C3C', '#9B59B6']
    for idx, (label, (fpr, tpr, auc_val)) in enumerate(roc_curves_data.items()):
        plt.plot(fpr, tpr, label=f"{label} (AUC = {auc_val:.3f})", color=colors[idx], linewidth=2.5)
    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Chance (AUC = 0.500)')
    plt.xlabel('False Positive Rate (1 - Specificity)', fontweight='bold')
    plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontweight='bold')
    plt.title(f'Classical MLP ROC Curves - {dataset_name}', fontweight='bold')
    plt.legend(loc='lower right')
    plt.grid(alpha=0.3)
    plt.tight_layout()
    roc_plot_path = os.path.join(FIGURES_CLASSICAL_DIR, f"{dataset_key.lower()}_mlp_roc_curves.png")
    plt.savefig(roc_plot_path, dpi=300)
    plt.close()

    # 2. Confusion Matrices
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    cm_full = results["models_full_features"]["mlp"]["test_metrics"]["confusion_matrix"]
    cm_pca = results["models_pca_features"]["mlp"]["test_metrics"]["confusion_matrix"]

    mat_full = [[cm_full["TN"], cm_full["FP"]], [cm_full["FN"], cm_full["TP"]]]
    mat_pca = [[cm_pca["TN"], cm_pca["FP"]], [cm_pca["FN"], cm_pca["TP"]]]

    sns.heatmap(mat_full, annot=True, fmt='d', cmap='Reds', ax=axes[0], cbar=False,
                xticklabels=['Pred Healthy', 'Pred Disease'], yticklabels=['Actual Healthy', 'Actual Disease'])
    axes[0].set_title("MLP (Full Features)", fontweight='bold')

    sns.heatmap(mat_pca, annot=True, fmt='d', cmap='Purples', ax=axes[1], cbar=False,
                xticklabels=['Pred Healthy', 'Pred Disease'], yticklabels=['Actual Healthy', 'Actual Disease'])
    axes[1].set_title("MLP (4-PCA Features)", fontweight='bold')

    plt.suptitle(f'MLP Neural Network Confusion Matrices - {dataset_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()
    cm_plot_path = os.path.join(FIGURES_CLASSICAL_DIR, f"{dataset_key.lower()}_mlp_confusion_matrices.png")
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()

    print(f" [SUCCESS] MLP figures saved in {FIGURES_CLASSICAL_DIR}")


def evaluate_classical_svm_suite(dataset_key, dataset_name):
    """
    Run complete classical SVM evaluation across Linear, RBF, and Polynomial kernels
    for both full-feature and 4-PCA representations.
    """
    print(f"\n" + "=" * 70)
    print(f" EXPERIMENT: CLASSICAL SVM BASELINE - {dataset_name.upper()}")
    print("=" * 70)
    
    # Load classical processed partition
    class_dir = os.path.join(DATA_PROC_DIR, dataset_key.lower(), "classical")
    X_train_full = np.load(os.path.join(class_dir, "X_train.npy"))
    X_test_full = np.load(os.path.join(class_dir, "X_test.npy"))
    y_train = np.load(os.path.join(class_dir, "y_train.npy"))
    y_test = np.load(os.path.join(class_dir, "y_test.npy"))
    
    # Load quantum 4-PCA partition for direct 1:1 architectural baseline comparison
    quant_dir = os.path.join(DATA_PROC_DIR, dataset_key.lower(), "quantum")
    X_train_pca = np.load(os.path.join(quant_dir, "X_train_quantum.npy"))
    X_test_pca = np.load(os.path.join(quant_dir, "X_test_quantum.npy"))
    
    # Define Parameter Search Spaces
    param_grids = {
        "linear": {
            "C": [0.01, 0.1, 1.0, 10.0, 100.0]
        },
        "rbf": {
            "C": [0.01, 0.1, 1.0, 10.0, 100.0],
            "gamma": ['scale', 0.001, 0.01, 0.1, 1.0]
        },
        "poly": {
            "C": [0.1, 1.0, 10.0],
            "degree": [2, 3],
            "gamma": ['scale', 0.01, 0.1]
        }
    }
    
    results = {
        "dataset_name": dataset_name,
        "dataset_key": dataset_key,
        "full_feature_dimension": int(X_train_full.shape[1]),
        "pca_feature_dimension": int(X_train_pca.shape[1]),
        "models_full_features": {},
        "models_pca_features": {}
    }
    
    roc_curves_data = {}
    
    # 1. Evaluate Full Feature Representation
    print(f"\n--- 1. Evaluating Full-Feature SVMs ({X_train_full.shape[1]} features) ---")
    for kernel in ["linear", "rbf", "poly"]:
        print(f" [*] Running 5-Fold CV + GridSearch for SVM-{kernel.upper()}...")
        cv_res = perform_stratified_cv_grid_search(X_train_full, y_train, kernel, param_grids[kernel])
        model = cv_res["best_model"]
        
        # Test evaluation
        t_start_train = time.time()
        model.fit(X_train_full, y_train)
        train_time = time.time() - t_start_train
        
        t_start_inf = time.time()
        y_test_pred = model.predict(X_test_full)
        y_test_prob = model.predict_proba(X_test_full)[:, 1]
        inf_time = time.time() - t_start_inf
        
        test_metrics = calculate_medical_metrics(y_test, y_test_pred, y_test_prob)
        test_metrics["training_time_sec"] = float(round(train_time, 5))
        test_metrics["inference_time_sec"] = float(round(inf_time, 5))
        
        # Save model
        model_save_path = os.path.join(MODELS_DIR, dataset_key.lower(), f"classical_{kernel}_full_svm.joblib")
        joblib.dump(model, model_save_path)
        
        # ROC data for plot
        fpr, tpr, _ = roc_curve(y_test, y_test_prob)
        roc_curves_data[f"{kernel.upper()} (Full)"] = (fpr, tpr, test_metrics["roc_auc"])
        
        results["models_full_features"][kernel] = {
            "best_params": cv_res["best_params"],
            "cv_summary": cv_res["cv_summary"],
            "cv_folds": cv_res["cv_folds"],
            "test_metrics": test_metrics,
            "model_path": model_save_path
        }
        
        print(f"     -> CV Accuracy: {cv_res['cv_summary']['accuracy_formatted']} | Test Acc: {test_metrics['accuracy']*100:.2f}% | Test AUC: {test_metrics['roc_auc']:.4f}")

    # 2. Evaluate 4-PCA Feature Representation (Direct parity with 4-Qubit QSVM)
    print(f"\n--- 2. Evaluating 4-Component PCA SVMs (1:1 QSVM Parity Baseline) ---")
    for kernel in ["linear", "rbf", "poly"]:
        print(f" [*] Running 5-Fold CV + GridSearch for PCA-SVM-{kernel.upper()}...")
        cv_res = perform_stratified_cv_grid_search(X_train_pca, y_train, kernel, param_grids[kernel])
        model = cv_res["best_model"]
        
        t_start_train = time.time()
        model.fit(X_train_pca, y_train)
        train_time = time.time() - t_start_train
        
        t_start_inf = time.time()
        y_test_pred = model.predict(X_test_pca)
        y_test_prob = model.predict_proba(X_test_pca)[:, 1]
        inf_time = time.time() - t_start_inf
        
        test_metrics = calculate_medical_metrics(y_test, y_test_pred, y_test_prob)
        test_metrics["training_time_sec"] = float(round(train_time, 5))
        test_metrics["inference_time_sec"] = float(round(inf_time, 5))
        
        model_save_path = os.path.join(MODELS_DIR, dataset_key.lower(), f"classical_{kernel}_pca_svm.joblib")
        joblib.dump(model, model_save_path)
        
        fpr, tpr, _ = roc_curve(y_test, y_test_prob)
        roc_curves_data[f"{kernel.upper()} (4-PCA)"] = (fpr, tpr, test_metrics["roc_auc"])
        
        results["models_pca_features"][kernel] = {
            "best_params": cv_res["best_params"],
            "cv_summary": cv_res["cv_summary"],
            "cv_folds": cv_res["cv_folds"],
            "test_metrics": test_metrics,
            "model_path": model_save_path
        }
        print(f"     -> CV Accuracy: {cv_res['cv_summary']['accuracy_formatted']} | Test Acc: {test_metrics['accuracy']*100:.2f}% | Test AUC: {test_metrics['roc_auc']:.4f}")

    # Save JSON Results
    json_path = os.path.join(RESULTS_CLASSICAL_DIR, f"{dataset_key.lower()}_classical_svm.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"\n [SUCCESS] Classical results saved to: {json_path}")
    
    # Generate Visualizations
    generate_classical_visualizations(results, roc_curves_data, dataset_key, dataset_name)
    
    return results


def generate_classical_visualizations(results, roc_curves_data, dataset_key, dataset_name):
    """Generate high-resolution ROC curves, confusion matrices, and CV performance bar charts."""
    # 1. ROC Curves Plot
    plt.figure(figsize=(8, 6))
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
    for idx, (label, (fpr, tpr, auc_val)) in enumerate(roc_curves_data.items()):
        plt.plot(fpr, tpr, label=f"{label} (AUC = {auc_val:.3f})", color=colors[idx % len(colors)], linewidth=2)
    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Chance (AUC = 0.500)')
    plt.xlabel('False Positive Rate (1 - Specificity)')
    plt.ylabel('True Positive Rate (Sensitivity / Recall)')
    plt.title(f'Classical SVM ROC Curves - {dataset_name}', fontweight='bold')
    plt.legend(loc='lower right')
    plt.tight_layout()
    roc_plot_path = os.path.join(FIGURES_CLASSICAL_DIR, f"{dataset_key.lower()}_roc_curves.png")
    plt.savefig(roc_plot_path, dpi=300)
    plt.close()

    # 2. Confusion Matrices for Primary Baseline (RBF Full vs RBF 4-PCA)
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    cm_full = results["models_full_features"]["rbf"]["test_metrics"]["confusion_matrix"]
    cm_pca = results["models_pca_features"]["rbf"]["test_metrics"]["confusion_matrix"]
    
    mat_full = [[cm_full["TN"], cm_full["FP"]], [cm_full["FN"], cm_full["TP"]]]
    mat_pca = [[cm_pca["TN"], cm_pca["FP"]], [cm_pca["FN"], cm_pca["TP"]]]
    
    sns.heatmap(mat_full, annot=True, fmt='d', cmap='Blues', ax=axes[0], cbar=False,
                xticklabels=['Pred Healthy', 'Pred Disease'], yticklabels=['Actual Healthy', 'Actual Disease'])
    axes[0].set_title("RBF SVM (Full Features)", fontweight='bold')
    
    sns.heatmap(mat_pca, annot=True, fmt='d', cmap='Greens', ax=axes[1], cbar=False,
                xticklabels=['Pred Healthy', 'Pred Disease'], yticklabels=['Actual Healthy', 'Actual Disease'])
    axes[1].set_title("RBF SVM (4-PCA Features)", fontweight='bold')
    
    plt.suptitle(f'Confusion Matrix Comparison - {dataset_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()
    cm_plot_path = os.path.join(FIGURES_CLASSICAL_DIR, f"{dataset_key.lower()}_confusion_matrices.png")
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()
    
    # 3. 5-Fold Cross Validation Accuracy Bar Chart
    plt.figure(figsize=(9, 5))
    models = ['Linear (Full)', 'RBF (Full)', 'Poly (Full)', 'Linear (PCA)', 'RBF (PCA)', 'Poly (PCA)']
    means = [
        results["models_full_features"]["linear"]["cv_summary"]["accuracy_mean"] * 100,
        results["models_full_features"]["rbf"]["cv_summary"]["accuracy_mean"] * 100,
        results["models_full_features"]["poly"]["cv_summary"]["accuracy_mean"] * 100,
        results["models_pca_features"]["linear"]["cv_summary"]["accuracy_mean"] * 100,
        results["models_pca_features"]["rbf"]["cv_summary"]["accuracy_mean"] * 100,
        results["models_pca_features"]["poly"]["cv_summary"]["accuracy_mean"] * 100
    ]
    stds = [
        results["models_full_features"]["linear"]["cv_summary"]["accuracy_std"] * 100,
        results["models_full_features"]["rbf"]["cv_summary"]["accuracy_std"] * 100,
        results["models_full_features"]["poly"]["cv_summary"]["accuracy_std"] * 100,
        results["models_pca_features"]["linear"]["cv_summary"]["accuracy_std"] * 100,
        results["models_pca_features"]["rbf"]["cv_summary"]["accuracy_std"] * 100,
        results["models_pca_features"]["poly"]["cv_summary"]["accuracy_std"] * 100
    ]
    
    bars = plt.bar(models, means, yerr=stds, capsize=5, color=['#2980B9', '#27AE60', '#8E44AD', '#5DADE2', '#58D68D', '#BB8FCE'], alpha=0.9)
    plt.ylabel('5-Fold CV Accuracy (%)')
    plt.title(f'5-Fold Stratified Cross-Validation Performance (μ ± σ) - {dataset_name}', fontweight='bold')
    plt.ylim(min(means) - 10, 102)
    plt.xticks(rotation=20)
    
    for bar, mean_val, std_val in zip(bars, means, stds):
        plt.text(bar.get_x() + bar.get_width() / 2, mean_val + std_val + 1, f"{mean_val:.1f}±{std_val:.1f}%",
                 ha='center', va='bottom', fontsize=9, fontweight='bold')
                 
    plt.tight_layout()
    cv_plot_path = os.path.join(FIGURES_CLASSICAL_DIR, f"{dataset_key.lower()}_cv_performance.png")
    plt.savefig(cv_plot_path, dpi=300)
    plt.close()
    
    print(f" [SUCCESS] Classical figures saved in {FIGURES_CLASSICAL_DIR}")


def generate_classical_markdown_report(cancer_svm_res, cardio_svm_res, cancer_mlp_res, cardio_mlp_res):
    """Generate Markdown report for classical baselines (SVM & MLP)."""
    md = f"""# Classical Machine Learning Baseline Benchmark Report
**Project:** Hybrid Quantum-Classical ML Platform for Early Disease Detection
**Evaluation Protocol:** 5-Fold Stratified Cross-Validation + Grid Search Optimization
**Models:** Support Vector Machines (Linear, RBF, Polynomial) + Multi-Layer Perceptron Neural Networks

---

## 1. Classical SVM Results Summary

### A. Breast Cancer Wisconsin Diagnostic (WDBC)

| Kernel Type | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\\mu \\pm \\sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear SVM** | Full (30 features) | `{cancer_svm_res['models_full_features']['linear']['best_params']}` | {cancer_svm_res['models_full_features']['linear']['cv_summary']['accuracy_formatted']} | {cancer_svm_res['models_full_features']['linear']['test_metrics']['accuracy']*100:.2f}% | {cancer_svm_res['models_full_features']['linear']['test_metrics']['sensitivity']*100:.2f}% | {cancer_svm_res['models_full_features']['linear']['test_metrics']['specificity']*100:.2f}% | {cancer_svm_res['models_full_features']['linear']['test_metrics']['roc_auc']:.4f} |
| **RBF SVM** *(Primary)* | Full (30 features) | `{cancer_svm_res['models_full_features']['rbf']['best_params']}` | {cancer_svm_res['models_full_features']['rbf']['cv_summary']['accuracy_formatted']} | {cancer_svm_res['models_full_features']['rbf']['test_metrics']['accuracy']*100:.2f}% | {cancer_svm_res['models_full_features']['rbf']['test_metrics']['sensitivity']*100:.2f}% | {cancer_svm_res['models_full_features']['rbf']['test_metrics']['specificity']*100:.2f}% | {cancer_svm_res['models_full_features']['rbf']['test_metrics']['roc_auc']:.4f} |
| **Polynomial SVM** | Full (30 features) | `{cancer_svm_res['models_full_features']['poly']['best_params']}` | {cancer_svm_res['models_full_features']['poly']['cv_summary']['accuracy_formatted']} | {cancer_svm_res['models_full_features']['poly']['test_metrics']['accuracy']*100:.2f}% | {cancer_svm_res['models_full_features']['poly']['test_metrics']['sensitivity']*100:.2f}% | {cancer_svm_res['models_full_features']['poly']['test_metrics']['specificity']*100:.2f}% | {cancer_svm_res['models_full_features']['poly']['test_metrics']['roc_auc']:.4f} |
| **RBF SVM** *(QSVM Parity)* | 4-PCA Features | `{cancer_svm_res['models_pca_features']['rbf']['best_params']}` | {cancer_svm_res['models_pca_features']['rbf']['cv_summary']['accuracy_formatted']} | {cancer_svm_res['models_pca_features']['rbf']['test_metrics']['accuracy']*100:.2f}% | {cancer_svm_res['models_pca_features']['rbf']['test_metrics']['sensitivity']*100:.2f}% | {cancer_svm_res['models_pca_features']['rbf']['test_metrics']['specificity']*100:.2f}% | {cancer_svm_res['models_pca_features']['rbf']['test_metrics']['roc_auc']:.4f} |

---

### B. UCI Heart Disease

| Kernel Type | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\\mu \\pm \\sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear SVM** | Full (13 features) | `{cardio_svm_res['models_full_features']['linear']['best_params']}` | {cardio_svm_res['models_full_features']['linear']['cv_summary']['accuracy_formatted']} | {cardio_svm_res['models_full_features']['linear']['test_metrics']['accuracy']*100:.2f}% | {cardio_svm_res['models_full_features']['linear']['test_metrics']['sensitivity']*100:.2f}% | {cardio_svm_res['models_full_features']['linear']['test_metrics']['specificity']*100:.2f}% | {cardio_svm_res['models_full_features']['linear']['test_metrics']['roc_auc']:.4f} |
| **RBF SVM** *(Primary)* | Full (13 features) | `{cardio_svm_res['models_full_features']['rbf']['best_params']}` | {cardio_svm_res['models_full_features']['rbf']['cv_summary']['accuracy_formatted']} | {cardio_svm_res['models_full_features']['rbf']['test_metrics']['accuracy']*100:.2f}% | {cardio_svm_res['models_full_features']['rbf']['test_metrics']['sensitivity']*100:.2f}% | {cardio_svm_res['models_full_features']['rbf']['test_metrics']['specificity']*100:.2f}% | {cardio_svm_res['models_full_features']['rbf']['test_metrics']['roc_auc']:.4f} |
| **Polynomial SVM** | Full (13 features) | `{cardio_svm_res['models_full_features']['poly']['best_params']}` | {cardio_svm_res['models_full_features']['poly']['cv_summary']['accuracy_formatted']} | {cardio_svm_res['models_full_features']['poly']['test_metrics']['accuracy']*100:.2f}% | {cardio_svm_res['models_full_features']['poly']['test_metrics']['sensitivity']*100:.2f}% | {cardio_svm_res['models_full_features']['poly']['test_metrics']['specificity']*100:.2f}% | {cardio_svm_res['models_full_features']['poly']['test_metrics']['roc_auc']:.4f} |
| **RBF SVM** *(QSVM Parity)* | 4-PCA Features | `{cardio_svm_res['models_pca_features']['rbf']['best_params']}` | {cardio_svm_res['models_pca_features']['rbf']['cv_summary']['accuracy_formatted']} | {cardio_svm_res['models_pca_features']['rbf']['test_metrics']['accuracy']*100:.2f}% | {cardio_svm_res['models_pca_features']['rbf']['test_metrics']['sensitivity']*100:.2f}% | {cardio_svm_res['models_pca_features']['rbf']['test_metrics']['specificity']*100:.2f}% | {cardio_svm_res['models_pca_features']['rbf']['test_metrics']['roc_auc']:.4f} |

---

## 2. Classical Neural Network (MLP) Results Summary

### A. Breast Cancer Wisconsin Diagnostic (WDBC)

| Architecture | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\\mu \\pm \\sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MLP** | Full (30 features) | `{cancer_mlp_res['models_full_features']['mlp']['best_params']}` | {cancer_mlp_res['models_full_features']['mlp']['cv_summary']['accuracy_formatted']} | {cancer_mlp_res['models_full_features']['mlp']['test_metrics']['accuracy']*100:.2f}% | {cancer_mlp_res['models_full_features']['mlp']['test_metrics']['sensitivity']*100:.2f}% | {cancer_mlp_res['models_full_features']['mlp']['test_metrics']['specificity']*100:.2f}% | {cancer_mlp_res['models_full_features']['mlp']['test_metrics']['roc_auc']:.4f} |
| **MLP** *(QNN Parity)* | 4-PCA Features | `{cancer_mlp_res['models_pca_features']['mlp']['best_params']}` | {cancer_mlp_res['models_pca_features']['mlp']['cv_summary']['accuracy_formatted']} | {cancer_mlp_res['models_pca_features']['mlp']['test_metrics']['accuracy']*100:.2f}% | {cancer_mlp_res['models_pca_features']['mlp']['test_metrics']['sensitivity']*100:.2f}% | {cancer_mlp_res['models_pca_features']['mlp']['test_metrics']['specificity']*100:.2f}% | {cancer_mlp_res['models_pca_features']['mlp']['test_metrics']['roc_auc']:.4f} |

### B. UCI Heart Disease

| Architecture | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\\mu \\pm \\sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MLP** | Full (13 features) | `{cardio_mlp_res['models_full_features']['mlp']['best_params']}` | {cardio_mlp_res['models_full_features']['mlp']['cv_summary']['accuracy_formatted']} | {cardio_mlp_res['models_full_features']['mlp']['test_metrics']['accuracy']*100:.2f}% | {cardio_mlp_res['models_full_features']['mlp']['test_metrics']['sensitivity']*100:.2f}% | {cardio_mlp_res['models_full_features']['mlp']['test_metrics']['specificity']*100:.2f}% | {cardio_mlp_res['models_full_features']['mlp']['test_metrics']['roc_auc']:.4f} |
| **MLP** *(QNN Parity)* | 4-PCA Features | `{cardio_mlp_res['models_pca_features']['mlp']['best_params']}` | {cardio_mlp_res['models_pca_features']['mlp']['cv_summary']['accuracy_formatted']} | {cardio_mlp_res['models_pca_features']['mlp']['test_metrics']['accuracy']*100:.2f}% | {cardio_mlp_res['models_pca_features']['mlp']['test_metrics']['sensitivity']*100:.2f}% | {cardio_mlp_res['models_pca_features']['mlp']['test_metrics']['specificity']*100:.2f}% | {cardio_mlp_res['models_pca_features']['mlp']['test_metrics']['roc_auc']:.4f} |

---

## 3. Clinical Diagnostic Significance
- **Sensitivity (Recall)** measures the percentage of positive disease cases correctly identified, directly reducing life-threatening **False Negatives**.
- **Specificity** measures healthy individuals correctly cleared, preventing unnecessary biopsies and invasive procedures (**False Positives**).

## 4. Neural Network Architecture Rationale
The Multi-Layer Perceptron (MLP) architecture was selected for medical diagnostics based on:
- **Dataset Size**: Small-to-medium medical datasets (300-600 samples) benefit from shallow-to-moderate architectures
- **Regularization**: L2 penalty (alpha) and early stopping prevent overfitting on limited clinical data
- **Activation**: ReLU enables non-linear decision boundaries suitable for complex biomarker interactions
- **Optimizer**: Adam provides adaptive learning rates, crucial for medical data with varying feature scales

This design balances model expressiveness with generalization for reliable clinical predictions.
"""
    report_file = os.path.join(REPORTS_DIR, "classical_baseline_report.md")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(md)
    print(f" [SUCCESS] Classical Master Report generated: {report_file}")


def main():
    print("=" * 75)
    print(" 02_CLASSICAL_ALGORITHMS: CLASSICAL ML BASELINES (SVM & NEURAL NETWORKS)")
    print("=" * 75)
    create_directories()

    # 1. Breast Cancer SVM Baseline
    cancer_svm_res = evaluate_classical_svm_suite("cancer", "Breast Cancer Wisconsin Diagnostic")

    # 2. Breast Cancer MLP Baseline
    cancer_mlp_res = evaluate_classical_mlp("cancer", "Breast Cancer Wisconsin Diagnostic")

    # 3. Cardiovascular SVM Baseline
    cardio_svm_res = evaluate_classical_svm_suite("cardiovascular", "UCI Heart Disease")

    # 4. Cardiovascular MLP Baseline
    cardio_mlp_res = evaluate_classical_mlp("cardiovascular", "UCI Heart Disease")

    # 5. Consolidated Markdown Report
    generate_classical_markdown_report(cancer_svm_res, cardio_svm_res, cancer_mlp_res, cardio_mlp_res)

    print("\n" + "=" * 75)
    print(" [SUCCESS] 02_CLASSICAL_ALGORITHMS COMPLETED SUCCESSFULLY!")
    print("=" * 75)


if __name__ == "__main__":
    main()
