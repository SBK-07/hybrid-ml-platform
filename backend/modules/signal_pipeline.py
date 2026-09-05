"""
signal_pipeline.py
==================
Biosignal Processing and Latent Feature Extraction Pipeline.
Extracts spectral, temporal, and non-linear dynamic features from physiological signals
(ECG waveforms, EEG bands, phonation acoustic measurements) for multimodal clinical fusion.
"""

import numpy as np
from typing import Dict, Any, List, Optional, Tuple


def extract_signal_spectral_features(
    signal_waveform: np.ndarray,
    sampling_rate: float = 250.0
) -> Dict[str, float]:
    """
    Extract frequency-domain and time-domain features from continuous biomedical signals.
    Computes spectral power density, dominant frequency, spectral entropy, and temporal moments.
    """
    sig = np.asarray(signal_waveform, dtype=float)
    n_samples = len(sig)

    if n_samples < 4:
        return {
            "signal_mean": 0.0, "signal_std": 0.0, "dominant_frequency": 0.0,
            "spectral_entropy": 0.0, "low_freq_power": 0.0, "high_freq_power": 0.0,
            "lf_hf_ratio": 1.0, "zero_crossing_rate": 0.0
        }

    # 1. Time-Domain Moments
    sig_mean = float(np.mean(sig))
    sig_std = float(np.std(sig))
    sig_centered = sig - sig_mean

    # Zero crossing rate
    zero_crossings = np.sum(np.diff(np.signbit(sig_centered))) / (n_samples - 1)

    # 2. Frequency-Domain (FFT)
    fft_vals = np.fft.rfft(sig_centered)
    fft_freqs = np.fft.rfftfreq(n_samples, d=1.0 / sampling_rate)
    psd = (np.abs(fft_vals) ** 2) / n_samples

    # Normalize PSD for spectral entropy
    psd_sum = np.sum(psd)
    if psd_sum > 1e-12:
        norm_psd = psd / psd_sum
        spectral_entropy = -float(np.sum(norm_psd * np.log2(norm_psd + 1e-12)))
    else:
        spectral_entropy = 0.0

    # Dominant peak frequency
    if len(psd) > 1:
        peak_idx = np.argmax(psd[1:]) + 1
        dominant_freq = float(fft_freqs[peak_idx])
    else:
        dominant_freq = 0.0

    # Low frequency (0.04 - 0.15 Hz) vs High frequency (0.15 - 0.4 Hz) for autonomic / ECG HRV
    lf_mask = (fft_freqs >= 0.04) & (fft_freqs < 0.15)
    hf_mask = (fft_freqs >= 0.15) & (fft_freqs < 0.4)

    lf_power = float(np.sum(psd[lf_mask])) if np.any(lf_mask) else 0.01
    hf_power = float(np.sum(psd[hf_mask])) if np.any(hf_mask) else 0.01
    lf_hf_ratio = float(lf_power / max(1e-6, hf_power))

    return {
        "signal_mean": round(sig_mean, 4),
        "signal_std": round(sig_std, 4),
        "dominant_frequency": round(dominant_freq, 4),
        "spectral_entropy": round(spectral_entropy, 4),
        "low_freq_power": round(lf_power, 4),
        "high_freq_power": round(hf_power, 4),
        "lf_hf_ratio": round(lf_hf_ratio, 4),
        "zero_crossing_rate": round(float(zero_crossings), 4)
    }


def encode_signal_features_to_latent(
    signal_features: Dict[str, float],
    latent_dim: int = 8
) -> np.ndarray:
    """
    Map extracted physiological signal metrics into a standardized latent vector
    z_sig in [-1.0, 1.0].
    """
    keys = [
        "signal_mean", "signal_std", "dominant_frequency", "spectral_entropy",
        "low_freq_power", "high_freq_power", "lf_hf_ratio", "zero_crossing_rate"
    ]
    raw_vec = np.array([signal_features.get(k, 0.0) for k in keys], dtype=float)

    # Standardize via tanh non-linearity
    latent_vec = np.tanh(raw_vec)
    if len(latent_vec) < latent_dim:
        pad_size = latent_dim - len(latent_vec)
        latent_vec = np.pad(latent_vec, (0, pad_size), mode='constant')
    elif len(latent_vec) > latent_dim:
        latent_vec = latent_vec[:latent_dim]

    return latent_vec


def simulate_biosignal_features_from_clinical_risk(risk_score: float, noise_std: float = 0.05) -> Dict[str, float]:
    """
    Generate realistic physiological signal indicators (e.g. ECG ST-segment elevation, HRV depression, vocal jitter)
    corresponding to a known risk tier.
    """
    base_std = 0.5 + 0.8 * risk_score + np.random.normal(0, noise_std)
    base_dom_freq = 1.2 + 2.5 * risk_score + np.random.normal(0, noise_std)
    base_entropy = 3.5 - 1.2 * risk_score + np.random.normal(0, noise_std)  # Pathological signals lose complexity
    base_lf_hf = 1.0 + 3.0 * risk_score + np.random.normal(0, noise_std)  # Sympathetic overdrive
    base_zcr = 0.1 + 0.3 * risk_score + np.random.normal(0, noise_std)

    return {
        "signal_mean": float(round(np.random.normal(0, 0.1), 4)),
        "signal_std": float(round(np.clip(base_std, 0.1, 3.0), 4)),
        "dominant_frequency": float(round(np.clip(base_dom_freq, 0.5, 10.0), 4)),
        "spectral_entropy": float(round(np.clip(base_entropy, 0.5, 6.0), 4)),
        "low_freq_power": float(round(np.clip(0.5 + 2.0 * risk_score, 0.1, 5.0), 4)),
        "high_freq_power": float(round(np.clip(2.0 - 1.5 * risk_score, 0.1, 5.0), 4)),
        "lf_hf_ratio": float(round(np.clip(base_lf_hf, 0.2, 8.0), 4)),
        "zero_crossing_rate": float(round(np.clip(base_zcr, 0.01, 0.8), 4))
    }
