# Classical Machine Learning Baseline Benchmark Report
**Project:** Hybrid Quantum-Classical ML Platform for Early Disease Detection
**Evaluation Protocol:** 5-Fold Stratified Cross-Validation + Grid Search Optimization
**Models:** Support Vector Machines (Linear, RBF, Polynomial) + Multi-Layer Perceptron Neural Networks

---

## 1. Classical SVM Results Summary

### A. Breast Cancer Wisconsin Diagnostic (WDBC)

| Kernel Type | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\mu \pm \sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear SVM** | Full (30 features) | `{'C': 0.1}` | 96.70% +/- 0.70% | 98.25% | 95.24% | 100.00% | 0.9964 |
| **RBF SVM** *(Primary)* | Full (30 features) | `{'C': 100.0, 'gamma': 0.001}` | 97.14% +/- 1.49% | 97.37% | 92.86% | 100.00% | 0.9957 |
| **Polynomial SVM** | Full (30 features) | `{'C': 1.0, 'degree': 3, 'gamma': 0.1}` | 95.60% +/- 1.97% | 93.86% | 83.33% | 100.00% | 0.9980 |
| **RBF SVM** *(QSVM Parity)* | 4-PCA Features | `{'C': 100.0, 'gamma': 0.1}` | 96.48% +/- 0.44% | 95.61% | 88.10% | 100.00% | 0.9977 |

---

### B. UCI Heart Disease

| Kernel Type | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\mu \pm \sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear SVM** | Full (13 features) | `{'C': 10.0}` | 92.58% +/- 3.32% | 91.80% | 98.08% | 55.56% | 0.9487 |
| **RBF SVM** *(Primary)* | Full (13 features) | `{'C': 0.1, 'gamma': 'scale'}` | 85.54% +/- 0.15% | 85.25% | 100.00% | 0.00% | 0.9509 |
| **Polynomial SVM** | Full (13 features) | `{'C': 10.0, 'degree': 3, 'gamma': 'scale'}` | 90.11% +/- 3.47% | 86.89% | 96.15% | 33.33% | 0.9274 |
| **RBF SVM** *(QSVM Parity)* | 4-PCA Features | `{'C': 10.0, 'gamma': 'scale'}` | 87.21% +/- 2.28% | 83.61% | 94.23% | 22.22% | 0.7543 |

---

## 2. Classical Neural Network (MLP) Results Summary

### A. Breast Cancer Wisconsin Diagnostic (WDBC)

| Architecture | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\mu \pm \sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MLP** | Full (30 features) | `{'activation': 'relu', 'alpha': 0.0001, 'hidden_layer_sizes': (128, 64), 'learning_rate_init': 0.01}` | 96.92% +/- 1.08% | 97.37% | 92.86% | 100.00% | 0.9854 |
| **MLP** *(QNN Parity)* | 4-PCA Features | `{'activation': 'relu', 'alpha': 0.0001, 'hidden_layer_sizes': (16, 8, 4), 'learning_rate_init': 0.01}` | 94.95% +/- 1.32% | 97.37% | 92.86% | 100.00% | 0.9980 |

### B. UCI Heart Disease

| Architecture | Representation | Best Hyperparameters | 5-Fold CV Accuracy ($\mu \pm \sigma$) | Test Accuracy | Test Sensitivity | Test Specificity | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MLP** | Full (13 features) | `{'activation': 'relu', 'alpha': 0.0001, 'hidden_layer_sizes': (32, 16, 8), 'learning_rate_init': 0.01}` | 90.11% +/- 2.93% | 85.25% | 100.00% | 0.00% | 0.5150 |
| **MLP** *(QNN Parity)* | 4-PCA Features | `{'activation': 'relu', 'alpha': 0.001, 'hidden_layer_sizes': (16, 8, 4), 'learning_rate_init': 0.01}` | 85.54% +/- 0.15% | 85.25% | 100.00% | 0.00% | 0.6795 |

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
