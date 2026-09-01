import os
import pandas as pd
import numpy as np

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")

def ensure_datasets_exist():
    os.makedirs(DATASETS_DIR, exist_ok=True)
    
    # 1. Heart Disease Dataset (UCI Cleveland benchmark simulation)
    heart_path = os.path.join(DATASETS_DIR, "heart.csv")
    if not os.path.exists(heart_path):
        np.random.seed(42)
        n_samples = 303
        data = {
            "age": np.random.randint(29, 77, size=n_samples),
            "sex": np.random.choice([0, 1], size=n_samples, p=[0.32, 0.68]),
            "cp": np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.47, 0.17, 0.28, 0.08]),
            "trestbps": np.random.randint(94, 200, size=n_samples),
            "chol": np.random.randint(126, 564, size=n_samples),
            "fbs": np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15]),
            "restecg": np.random.choice([0, 1, 2], size=n_samples, p=[0.49, 0.48, 0.03]),
            "thalach": np.random.randint(71, 202, size=n_samples),
            "exang": np.random.choice([0, 1], size=n_samples, p=[0.68, 0.32]),
            "oldpeak": np.round(np.random.uniform(0.0, 6.2, size=n_samples), 1),
            "slope": np.random.choice([0, 1, 2], size=n_samples, p=[0.07, 0.46, 0.47]),
            "ca": np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.58, 0.21, 0.12, 0.09]),
            "thal": np.random.choice([1, 2, 3], size=n_samples, p=[0.06, 0.55, 0.39])
        }
        # Realistic target correlation
        score = (data["age"] > 55).astype(int) + (data["cp"] > 0).astype(int) * 2 + (data["thalach"] < 140).astype(int) + (data["oldpeak"] > 1.5).astype(int) * 2 + (data["ca"] > 0).astype(int) * 2
        data["target"] = (score >= 3).astype(int)
        pd.DataFrame(data).to_csv(heart_path, index=False)
        print(f"Generated {heart_path}")

    # 2. PIMA Indians Diabetes Dataset
    diabetes_path = os.path.join(DATASETS_DIR, "diabetes.csv")
    if not os.path.exists(diabetes_path):
        np.random.seed(42)
        n_samples = 300
        data = {
            "Pregnancies": np.random.randint(0, 15, size=n_samples),
            "Glucose": np.random.randint(70, 199, size=n_samples),
            "BloodPressure": np.random.randint(40, 110, size=n_samples),
            "SkinThickness": np.random.randint(10, 50, size=n_samples),
            "Insulin": np.random.randint(15, 250, size=n_samples),
            "BMI": np.round(np.random.uniform(18.0, 48.0, size=n_samples), 1),
            "DiabetesPedigreeFunction": np.round(np.random.uniform(0.08, 2.3, size=n_samples), 3),
            "Age": np.random.randint(21, 81, size=n_samples)
        }
        score = (data["Glucose"] > 125).astype(int) * 3 + (data["BMI"] > 30).astype(int) * 2 + (data["Age"] > 40).astype(int) + (data["Insulin"] > 140).astype(int)
        data["Outcome"] = (score >= 3).astype(int)
        pd.DataFrame(data).to_csv(diabetes_path, index=False)
        print(f"Generated {diabetes_path}")

    # 3. Parkinson's Voice Dataset
    parkinsons_path = os.path.join(DATASETS_DIR, "parkinsons.csv")
    if not os.path.exists(parkinsons_path):
        np.random.seed(42)
        n_samples = 195
        data = {
            "MDVP:Fo(Hz)": np.round(np.random.uniform(88.0, 260.0, size=n_samples), 2),
            "MDVP:Fhi(Hz)": np.round(np.random.uniform(100.0, 590.0, size=n_samples), 2),
            "MDVP:Flo(Hz)": np.round(np.random.uniform(65.0, 240.0, size=n_samples), 2),
            "MDVP:Jitter(%)": np.round(np.random.uniform(0.001, 0.03, size=n_samples), 5),
            "MDVP:Shimmer": np.round(np.random.uniform(0.01, 0.12, size=n_samples), 4),
            "NHR": np.round(np.random.uniform(0.0006, 0.3, size=n_samples), 4),
            "HNR": np.round(np.random.uniform(8.0, 33.0, size=n_samples), 2),
            "RPDE": np.round(np.random.uniform(0.25, 0.68, size=n_samples), 4),
            "DFA": np.round(np.random.uniform(0.57, 0.82, size=n_samples), 4),
            "spread1": np.round(np.random.uniform(-7.9, -2.4, size=n_samples), 3),
            "spread2": np.round(np.random.uniform(0.006, 0.45, size=n_samples), 4),
            "D2": np.round(np.random.uniform(1.4, 3.6, size=n_samples), 4),
            "PPE": np.round(np.random.uniform(0.04, 0.52, size=n_samples), 4)
        }
        score = (data["MDVP:Jitter(%)"] > 0.01).astype(int) * 2 + (data["HNR"] < 20.0).astype(int) * 2 + (data["PPE"] > 0.2).astype(int) * 2
        data["status"] = (score >= 3).astype(int)
        pd.DataFrame(data).to_csv(parkinsons_path, index=False)
        print(f"Generated {parkinsons_path}")

if __name__ == "__main__":
    ensure_datasets_exist()
