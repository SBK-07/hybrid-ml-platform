import numpy as np
import shap

class ExplainabilityEngine:
    def __init__(self, feature_names: list, target_name: str = "target"):
        self.feature_names = feature_names
        self.target_name = target_name

    def explain_classical(self, model, X_sample):
        """Compute SHAP feature importances for classical models."""
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_sample)
            
            # If multi-class or list, take binary class 1
            if isinstance(shap_values, list):
                shap_matrix = np.abs(shap_values[1])
            else:
                shap_matrix = np.abs(shap_values)
                
            mean_shap = np.mean(shap_matrix, axis=0)
            
            # Normalize to 100% scale
            total = np.sum(mean_shap) + 1e-8
            importance_pct = (mean_shap / total) * 100

            feature_importance = [
                {"feature": str(self.feature_names[i]), "importance": float(np.round(importance_pct[i], 2))}
                for i in range(len(self.feature_names))
            ]
            
            # Sort descending
            feature_importance = sorted(feature_importance, key=lambda x: x["importance"], reverse=True)
            return feature_importance
        except Exception as e:
            # Fallback if SHAP fails (e.g. non-tree model): use random forest feature_importances_
            if hasattr(model, "feature_importances_"):
                imp = model.feature_importances_
                total = np.sum(imp) + 1e-8
                feature_importance = [
                    {"feature": str(self.feature_names[i]), "importance": float(np.round((imp[i]/total)*100, 2))}
                    for i in range(len(self.feature_names))
                ]
                return sorted(feature_importance, key=lambda x: x["importance"], reverse=True)
            return []

    def generate_clinician_summary(self, patient_dict: dict, top_features: list, prediction_res: dict):
        """Generate a plain-language clinician diagnostic summary."""
        hybrid_pred = prediction_res.get("Hybrid Fusion", prediction_res.get("Classical (Random Forest)", {}))
        prob = hybrid_pred.get("probability", 0.5)
        label_str = "POSITIVE (High Disease Risk)" if prob >= 0.5 else "NEGATIVE (Low Disease Risk)"
        conf = hybrid_pred.get("confidence", "N/A")

        top_3 = top_features[:3] if len(top_features) >= 3 else top_features
        factors_str = ", ".join([f"**{item['feature']}** ({patient_dict.get(item['feature'], 'N/A')})" for item in top_3])

        summary = (
            f"**Diagnostic Assessment**: {label_str} with {conf} confidence.\n"
            f"**Key Clinical Risk Drivers**: The primary features contributing to this prediction are {factors_str}.\n"
            f"**Quantum-Classical Consensus**: "
            f"Classical model probability = {round(prediction_res.get('Classical (Random Forest)', {}).get('probability', 0)*100, 1)}%, "
            f"Quantum model probability = {round(prediction_res.get('Quantum (QSVM)', {}).get('probability', 0)*100, 1)}%."
        )

        return summary
