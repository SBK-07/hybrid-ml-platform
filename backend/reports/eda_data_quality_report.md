# Scientific Data Quality & Preprocessing Report
**Project:** Hybrid Quantum-Classical ML Platform for Early Disease Detection  
**Author:** Research Pipeline Engine  
**Status:** Validated & Leak-Free Transformed  

---

## 1. Executive Data Quality Summary

| Metric / Attribute | Breast Cancer (WDBC) | UCI Heart Disease |
| :--- | :--- | :--- |
| **Total Samples** | 569 | 303 |
| **Raw Feature Dimension** | 30 | 13 |
| **Target Classes** | 0: Benign (357), 1: Malignant (212) | 0: Healthy (44), 1: Disease (259) |
| **Disease Prevalence** | 37.26% | 85.48% |
| **Class Imbalance Ratio** | 0.5938 | 5.8864 |
| **Missing Values Audit** | None detected (100% complete) | Zero / Medians verified |
| **Duplicate Records** | 0 | 0 |
| **Quantum Target Dimension** | 4 Qubits (PCA) | 4 Qubits (PCA) |

---

## 2. Zero Data Leakage Protocol
All statistical estimators, including:
1. `StandardScaler` (Z-score feature normalization)
2. `PCA` (Principal Component Analysis to 4 dimensions)
3. `MinMaxScaler` (Mapping components to quantum rotation range $[0, \pi]$)

were fitted **exclusively on the training partition** (80% stratified split, seed 42). The test set (20%) remained strictly out-of-sample and was transformed using pre-fitted parameters, completely eliminating data leakage.

---

## 3. Quantum Feature Encoding Strategy
High-dimensional biomedical features (30 for WDBC, 13 for Heart Disease) are compressed into 4 orthogonal principal components, capturing optimal variance, and subsequently mapped into the Hilbert space rotation domain:

$$\phi_i(x) = \pi \cdot \frac{x_i - \min(x_i)}{\max(x_i) - \min(x_i)} \in [0, \pi]$$

This supports parameterized $U_\phi(x)$ quantum state preparation for ZZFeatureMap and PauliFeatureMap circuits on NISQ simulators and IBM Quantum hardware.
