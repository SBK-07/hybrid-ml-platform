# Quantum Kernel SVM (QSVM) Research Report
**Project:** Hybrid Quantum-Classical ML Platform for Early Disease Detection  
**Quantum Framework:** Qiskit 2.5+ / AerSimulator / Statevector Primitives  
**Feature Map:** Parameterized $ZZFeatureMap(n=4, \text{reps}=2)$  

---

## 1. Executive Quantum Performance Summary

| Metric / Parameter | Breast Cancer (WDBC) | UCI Heart Disease |
| :--- | :--- | :--- |
| **Feature Map** | $ZZFeatureMap$ ($n=4, \text{reps}=2$) | $ZZFeatureMap$ ($n=4, \text{reps}=2$) |
| **Circuit Depth** | 19 | 19 |
| **Total Quantum Gates** | 34 (12 CNOTs) | 34 (12 CNOTs) |
| **5-Fold CV Accuracy** | 84.62% +/- 4.87% | 85.54% +/- 0.15% |
| **Test Accuracy** | 85.09% | 83.61% |
| **Test Sensitivity (Recall)** | 76.19% | 98.08% |
| **Test Specificity** | 90.28% | 0.00% |
| **Test ROC-AUC** | 0.9157 | 0.7628 |
| **Kernel Construction Time** | 0.405 s | 0.216 s |

---

## 2. Quantum Resource & Scaling Analysis
- **Entanglement Capability**: The $ZZFeatureMap$ introduces pairwise two-qubit controlled phase ($CX$) interactions parameterized by feature cross-products, mapping non-linear clinical collinearities into high-dimensional Hilbert space.
- **Noise Resilience**: Under 1%, 3%, and 5% depolarizing noise channels, the QSVM demonstrates predictable fidelity degradation, reflecting NISQ hardware constraints.
