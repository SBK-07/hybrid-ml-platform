# Classical SVM Baseline Benchmark Report
**Project:** Hybrid Quantum-Classical ML Platform for Early Disease Detection  
**Evaluation Protocol:** 5-Fold Stratified Cross-Validation + Grid Search Optimization  

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

## 2. Clinical Diagnostic Significance
- **Sensitivity (Recall)** measures the percentage of positive disease cases correctly identified, directly reducing life-threatening **False Negatives**.
- **Specificity** measures healthy individuals correctly cleared, preventing unnecessary biopsies and invasive procedures (**False Positives**).
