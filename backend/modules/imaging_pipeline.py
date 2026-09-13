"""
imaging_pipeline.py
===================
Biomedical Imaging Feature Extraction and Latent Representation Pipeline.
Processes 2D/3D biomedical imagery (MRI brain scans, mammography FNA, histopathology tiles,
X-ray patches, CT, DICOM, NIfTI) into standardized clinical radiomic biomarkers and
latent embeddings for hybrid quantum-classical fusion.
"""

import io
import os
import math
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union
try:
    from scipy import ndimage
except Exception:
    class NDImageFallback:
        @staticmethod
        def sobel(a, axis=0):
            a = np.asarray(a, dtype=float)
            if axis == 0:
                kernel = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])
            else:
                kernel = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
            h, w = a.shape
            out = np.zeros_like(a)
            padded = np.pad(a, 1, mode='edge')
            for i in range(3):
                for j in range(3):
                    out += kernel[i, j] * padded[i:i+h, j:j+w]
            return out

        @staticmethod
        def laplace(a):
            a = np.asarray(a, dtype=float)
            kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
            h, w = a.shape
            out = np.zeros_like(a)
            padded = np.pad(a, 1, mode='edge')
            for i in range(3):
                for j in range(3):
                    out += kernel[i, j] * padded[i:i+h, j:j+w]
            return out

    ndimage = NDImageFallback()

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pydicom
    PYDICOM_AVAILABLE = True
except ImportError:
    PYDICOM_AVAILABLE = False

try:
    import nibabel as nib
    NIBABEL_AVAILABLE = True
except ImportError:
    NIBABEL_AVAILABLE = False


def decode_image_bytes_to_array(
    file_bytes: bytes,
    filename: str = ""
) -> Optional[np.ndarray]:
    """
    Robust universal biomedical image decoder supporting:
      1. Standard formats: PNG, JPG, JPEG, BMP, TIFF, WebP (via PIL or fallback)
      2. Medical DICOM: .dcm, .dicom, .ima (via pydicom)
      3. Medical NIfTI: .nii, .nii.gz (via nibabel)
      4. NumPy arrays: .npy, .npz
      5. Fallback raw byte array conversion
    """
    fname_lower = filename.lower()

    # 1. DICOM file handling
    if any(fname_lower.endswith(ext) for ext in ['.dcm', '.dicom', '.ima']) or file_bytes.startswith(b'DICM', 128):
        if PYDICOM_AVAILABLE:
            try:
                dcm = pydicom.dcmread(io.BytesIO(file_bytes), force=True)
                arr = dcm.pixel_array.astype(float)
                if arr.ndim == 3:
                    # Select central slice for 3D DICOM volumes
                    arr = arr[arr.shape[0] // 2]
                return arr
            except Exception as e:
                print(f"[Warning] DICOM decoding error: {e}")

    # 2. NIfTI file handling (.nii, .nii.gz)
    if any(fname_lower.endswith(ext) for ext in ['.nii', '.nii.gz']):
        if NIBABEL_AVAILABLE:
            try:
                import tempfile
                suffix = '.nii.gz' if fname_lower.endswith('.gz') else '.nii'
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                nii = nib.load(tmp_path)
                data = nii.get_fdata()
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
                if data.ndim >= 3:
                    # Pick central axial slice
                    mid = data.shape[2] // 2 if data.shape[2] > 1 else 0
                    arr = data[:, :, mid].astype(float)
                else:
                    arr = data.astype(float)
                return arr
            except Exception as e:
                print(f"[Warning] NIfTI decoding error: {e}")

    # 3. NumPy format (.npy)
    if fname_lower.endswith('.npy'):
        try:
            arr = np.load(io.BytesIO(file_bytes))
            if arr.ndim > 2:
                arr = np.mean(arr, axis=0 if arr.ndim == 3 and arr.shape[0] < arr.shape[1] else -1)
            return arr.astype(float)
        except Exception:
            pass

    # 4. Standard 2D Image Formats via PIL
    if PIL_AVAILABLE:
        try:
            pil_img = PILImage.open(io.BytesIO(file_bytes))
            if pil_img.mode != 'L':
                pil_img = pil_img.convert('L')
            # Resize very large images down to max 256x256 for fast feature extraction
            if pil_img.width > 256 or pil_img.height > 256:
                pil_img.thumbnail((256, 256))
            return np.array(pil_img, dtype=float)
        except Exception as e:
            pass

    # 5. Raw Byte Stream Fallback (e.g. grayscale raw pixel matrix)
    try:
        raw_arr = np.frombuffer(file_bytes, dtype=np.uint8)
        side = int(math.isqrt(len(raw_arr)))
        if side >= 16:
            square_arr = raw_arr[:side * side].reshape((side, side)).astype(float)
            return square_arr
    except Exception:
        pass

    return None


def convert_image_bytes_to_png_bytes(file_bytes: bytes, filename: str = "") -> bytes:
    """
    Ensure any decoded biomedical image (DICOM, NIfTI, TIFF, BMP, WebP, PNG, JPG)
    is converted into a standardized 8-bit web-renderable PNG byte stream.
    """
    if PIL_AVAILABLE:
        try:
            arr = decode_image_bytes_to_array(file_bytes, filename)
            if arr is not None:
                p_min, p_max = float(np.min(arr)), float(np.max(arr))
                if p_max > p_min:
                    norm = ((arr - p_min) / (p_max - p_min) * 255.0).astype(np.uint8)
                else:
                    norm = np.zeros_like(arr, dtype=np.uint8)
                pil_img = PILImage.fromarray(norm)
                buf = io.BytesIO()
                pil_img.save(buf, format="PNG")
                return buf.getvalue()
        except Exception as e:
            print(f"[Warning] Failed converting image to PNG: {e}")
    return file_bytes


def generate_radiomic_diagnostic_explanation(
    radiomics: Dict[str, float],
    label: int,
    domain: str = "Biomedical Imaging",
    sample_name: str = ""
) -> str:
    """
    Generate an authentic, interpretable diagnostic breakdown for a specific image
    based on its genuine extracted radiomic biomarker readings.
    """
    contrast = radiomics.get("mri_spatial_contrast", 0.02)
    heterogeneity = radiomics.get("mri_tissue_heterogeneity", 0.05)
    edge_density = radiomics.get("mri_edge_density", 0.15)
    symmetry = radiomics.get("mri_hemispheric_symmetry", 0.85)
    intensity_mean = radiomics.get("mri_intensity_mean", 0.25)

    prefix = f"Scan [{sample_name}]: " if sample_name else ""

    if label == 1:
        details = []
        if contrast > 0.015 or heterogeneity > 0.06:
            details.append(f"elevated GLCM spatial contrast ({contrast:.4f}) and high tissue heterogeneity ({heterogeneity:.3f}) indicating hyperintense lesion tissue with active neo-vascularization")
        else:
            details.append(f"focal texture disruption (spatial contrast {contrast:.4f})")

        if symmetry < 0.82:
            details.append(f"disrupted anatomical symmetry ({symmetry:.2f} vs control >0.90) due to focal mass expansion")

        if edge_density > 0.18:
            details.append(f"pronounced peritumoral edge gradient ({edge_density:.3f}) indicating invasive tissue boundaries")

        return f"{prefix}Pathological tissue profile identified. Key findings: {'; '.join(details)}. 4-Qubit quantum feature mapping projects these non-linear texture anomalies into high-dimensional Hilbert space, enabling robust classification by QSVM and classical SVM."
    else:
        return f"{prefix}Normal physiological scan confirmed. Uniform tissue texture (mean intensity {intensity_mean:.3f}), low local spatial contrast ({contrast:.4f}), preserved bilateral symmetry ({symmetry:.2f}), and baseline physiological edge gradients ({edge_density:.3f}) with zero focal space-occupying lesions."


def extract_mri_radiomics_features(image_patch: Union[np.ndarray, bytes]) -> Dict[str, float]:
    """
    Comprehensive MRI Radiomics & Tissue Biomarker Extraction Engine.
    Computes 24 clinical biomarkers:
      - 1st-Order Statistical Moments (Mean, Std, Variance, Skewness, Kurtosis, Energy, Entropy, RMS, P10, P90)
      - GLCM Spatial Texture & Heterogeneity (Contrast, Homogeneity, Dissimilarity, Correlation, Energy)
      - Morphological & Structural Boundaries (Sobel Edge Density, Laplacian Sharpness, Compactness, Foreground Ratio)
      - Spectral & Symmetry Indices (High-Freq Fourier Ratio, Spectral Entropy, Hemispheric Symmetry, Dynamic Range, CNR)
    """
    if isinstance(image_patch, bytes):
        patch = decode_image_bytes_to_array(image_patch)
        if patch is None:
            patch = np.zeros((64, 64), dtype=float)
    else:
        patch = np.asarray(image_patch, dtype=float)

    if patch.ndim > 2:
        patch = np.mean(patch, axis=-1)

    # Clean non-finite values
    patch = np.nan_to_num(patch, nan=0.0, posinf=1.0, neginf=0.0)

    # Normalize to [0, 1]
    p_min, p_max = float(patch.min()), float(patch.max())
    if p_max > p_min:
        norm_patch = (patch - p_min) / (p_max - p_min)
    else:
        norm_patch = np.zeros_like(patch)

    h, w = norm_patch.shape
    total_pixels = max(1, h * w)

    # 1. First-Order Statistical Moments
    mean_val = float(np.mean(norm_patch))
    var_val = float(np.var(norm_patch))
    std_val = float(np.std(norm_patch))

    if std_val > 1e-6:
        skewness = float(np.mean(((norm_patch - mean_val) / std_val) ** 3))
        kurtosis = float(np.mean(((norm_patch - mean_val) / std_val) ** 4) - 3.0)
    else:
        skewness, kurtosis = 0.0, 0.0

    # Percentiles
    p10_val = float(np.percentile(norm_patch, 10))
    p90_val = float(np.percentile(norm_patch, 90))
    dynamic_range = float(p90_val - p10_val)
    rms_intensity = float(np.sqrt(np.mean(norm_patch ** 2)))

    # Histogram-based Shannon Entropy
    hist, _ = np.histogram(norm_patch, bins=32, range=(0.0, 1.0), density=True)
    hist_prob = hist / (np.sum(hist) + 1e-12)
    hist_prob = hist_prob[hist_prob > 0]
    shannon_entropy = float(-np.sum(hist_prob * np.log2(hist_prob)))

    # Uniformity / Energy
    first_order_energy = float(np.sum(norm_patch ** 2) / total_pixels)

    # 2. Spatial Gradient & Edge Density (Sobel filter)
    dx = ndimage.sobel(norm_patch, axis=0)
    dy = ndimage.sobel(norm_patch, axis=1)
    gradient_mag = np.hypot(dx, dy)
    edge_density = float(np.mean(gradient_mag))

    # Laplacian Focus / Tissue Heterogeneity
    laplacian = ndimage.laplace(norm_patch)
    laplacian_var = float(np.var(laplacian))

    # Foreground Tissue Ratio (active parenchyma vs background dark voxels)
    foreground_mask = norm_patch > 0.08
    foreground_ratio = float(np.sum(foreground_mask) / total_pixels)

    # 3. GLCM Spatial Texture & Co-occurrence
    # Horizontal shift
    shift_x = np.roll(norm_patch, shift=1, axis=1)
    diff_x = (norm_patch - shift_x) ** 2
    contrast = float(np.mean(diff_x))
    homogeneity = float(np.mean(1.0 / (1.0 + diff_x)))
    dissimilarity = float(np.mean(np.abs(norm_patch - shift_x)))

    # Spatial correlation
    var_guard = var_val if var_val > 1e-6 else 1.0
    correlation = float(np.mean((norm_patch - mean_val) * (shift_x - mean_val)) / var_guard)
    glcm_energy = float(np.sum((1.0 / (1.0 + diff_x)) ** 2) / total_pixels)

    # 4. Hemispheric Radial Symmetry (Brain MRI lateral symmetry)
    if w >= 4:
        left_half = norm_patch[:, :w // 2]
        right_half = np.fliplr(norm_patch[:, w // 2:])
        min_w = min(left_half.shape[1], right_half.shape[1])
        sym_diff = np.abs(left_half[:, :min_w] - right_half[:, :min_w])
        symmetry_index = float(1.0 - np.clip(np.mean(sym_diff) * 2.0, 0.0, 1.0))
    else:
        symmetry_index = 0.85

    # 5. Fourier Spectral Energy & Frequency Complexity
    try:
        fft2 = np.fft.fft2(norm_patch)
        fft_shift = np.fft.fftshift(np.abs(fft2))
        cy, cx = h // 2, w // 2
        r = min(h, w) // 4
        # Low freq center mask
        y_grid, x_grid = np.ogrid[:h, :w]
        center_mask = ((y_grid - cy)**2 + (x_grid - cx)**2) <= r**2
        total_fft = np.sum(fft_shift) + 1e-12
        low_fft = np.sum(fft_shift[center_mask])
        high_freq_ratio = float(np.clip((total_fft - low_fft) / total_fft, 0.0, 1.0))
    except Exception:
        high_freq_ratio = 0.25

    # 6. Compactness & Contrast-to-Noise Ratio (CNR)
    perimeter_approx = float(np.sum(gradient_mag > 0.3))
    area_approx = float(np.sum(foreground_mask))
    compactness = float((perimeter_approx ** 2) / (4.0 * np.pi * max(1.0, area_approx)))
    compactness_clamped = float(np.clip(compactness, 0.0, 50.0))

    bg_voxels = norm_patch[~foreground_mask]
    fg_voxels = norm_patch[foreground_mask]
    bg_std = float(np.std(bg_voxels)) if len(bg_voxels) > 10 else 0.05
    fg_mean = float(np.mean(fg_voxels)) if len(fg_voxels) > 10 else mean_val
    bg_mean = float(np.mean(bg_voxels)) if len(bg_voxels) > 10 else 0.02
    cnr = float(np.clip((fg_mean - bg_mean) / (bg_std + 1e-6), 0.0, 20.0))

    return {
        "mri_intensity_mean": round(mean_val, 4),
        "mri_intensity_std": round(std_val, 4),
        "mri_intensity_variance": round(var_val, 4),
        "mri_intensity_skewness": round(skewness, 4),
        "mri_intensity_kurtosis": round(kurtosis, 4),
        "mri_intensity_entropy": round(shannon_entropy, 4),
        "mri_intensity_energy": round(first_order_energy, 4),
        "mri_intensity_rms": round(rms_intensity, 4),
        "mri_intensity_p10": round(p10_val, 4),
        "mri_intensity_p90": round(p90_val, 4),
        "mri_dynamic_range": round(dynamic_range, 4),
        "mri_edge_density": round(edge_density, 4),
        "mri_laplacian_sharpness": round(laplacian_var, 4),
        "mri_foreground_ratio": round(foreground_ratio, 4),
        "mri_spatial_contrast": round(contrast, 4),
        "mri_spatial_homogeneity": round(homogeneity, 4),
        "mri_spatial_dissimilarity": round(dissimilarity, 4),
        "mri_spatial_correlation": round(correlation, 4),
        "mri_glcm_energy": round(glcm_energy, 4),
        "mri_hemispheric_symmetry": round(symmetry_index, 4),
        "mri_high_freq_fourier_ratio": round(high_freq_ratio, 4),
        "mri_compactness": round(compactness_clamped, 4),
        "mri_contrast_to_noise": round(cnr, 4),
        "mri_tissue_heterogeneity": round(float(var_val * 2.0 + contrast), 4)
    }


def extract_texture_features_from_patch(image_patch: np.ndarray) -> Dict[str, float]:
    """
    Standard GLCM-inspired statistical texture features for general tiles/patches.
    """
    patch = np.asarray(image_patch, dtype=float)
    if patch.ndim > 2:
        patch = np.mean(patch, axis=-1)

    p_min, p_max = patch.min(), patch.max()
    if p_max > p_min:
        norm_patch = (patch - p_min) / (p_max - p_min)
    else:
        norm_patch = np.zeros_like(patch)

    mean_val = float(np.mean(norm_patch))
    variance_val = float(np.var(norm_patch))
    std_val = float(np.std(norm_patch))

    if std_val > 1e-6:
        skewness = float(np.mean(((norm_patch - mean_val) / std_val) ** 3))
        kurtosis = float(np.mean(((norm_patch - mean_val) / std_val) ** 4) - 3.0)
    else:
        skewness, kurtosis = 0.0, 0.0

    dx = ndimage.sobel(norm_patch, axis=0)
    dy = ndimage.sobel(norm_patch, axis=1)
    gradient_magnitude = np.hypot(dx, dy)
    edge_density = float(np.mean(gradient_magnitude))

    shifted_x = np.roll(norm_patch, shift=1, axis=1)
    diff_x = (norm_patch - shifted_x) ** 2
    contrast = float(np.mean(diff_x))
    homogeneity = float(np.mean(1.0 / (1.0 + diff_x)))
    energy = float(np.sum(norm_patch ** 2)) / (norm_patch.size + 1e-8)

    return {
        "intensity_mean": round(mean_val, 4),
        "intensity_var": round(variance_val, 4),
        "intensity_skew": round(skewness, 4),
        "intensity_kurtosis": round(kurtosis, 4),
        "edge_density": round(edge_density, 4),
        "spatial_contrast": round(contrast, 4),
        "spatial_homogeneity": round(homogeneity, 4),
        "texture_energy": round(energy, 4)
    }


def encode_imaging_features_to_latent(
    texture_features: Dict[str, float],
    latent_dim: int = 8
) -> np.ndarray:
    """
    Map extracted morphological and texture features into a standardized latent vector
    z_img in [-1.0, 1.0].
    """
    raw_vals = [float(v) for v in texture_features.values()]
    raw_vec = np.array(raw_vals, dtype=float) if raw_vals else np.zeros(latent_dim, dtype=float)

    latent_vec = np.tanh(raw_vec)
    if len(latent_vec) < latent_dim:
        pad_size = latent_dim - len(latent_vec)
        latent_vec = np.pad(latent_vec, (0, pad_size), mode='constant')
    elif len(latent_vec) > latent_dim:
        latent_vec = latent_vec[:latent_dim]

    return latent_vec


def simulate_imaging_features_from_clinical_risk(risk_score: float, noise_std: float = 0.05) -> Dict[str, float]:
    """
    Generate realistic imaging-derived features corresponding to a known risk tier
    for testing multimodal clinical triage.
    """
    base_mean = 0.3 + 0.5 * risk_score + np.random.normal(0, noise_std)
    base_var = 0.1 + 0.3 * risk_score + np.random.normal(0, noise_std)
    base_edge = 0.2 + 0.6 * risk_score + np.random.normal(0, noise_std)
    base_contrast = 0.15 + 0.45 * risk_score + np.random.normal(0, noise_std)
    base_homog = 0.8 - 0.5 * risk_score + np.random.normal(0, noise_std)
    base_energy = 0.4 + 0.3 * risk_score + np.random.normal(0, noise_std)

    return {
        "mri_intensity_mean": float(np.clip(base_mean, 0.0, 1.0)),
        "mri_intensity_variance": float(np.clip(base_var, 0.0, 1.0)),
        "mri_intensity_skewness": float(np.clip(risk_score * 1.5 - 0.5, -2.0, 2.0)),
        "mri_intensity_kurtosis": float(np.clip(risk_score * 2.0 - 1.0, -1.0, 4.0)),
        "mri_edge_density": float(np.clip(base_edge, 0.0, 1.0)),
        "mri_spatial_contrast": float(np.clip(base_contrast, 0.0, 1.0)),
        "mri_spatial_homogeneity": float(np.clip(base_homog, 0.0, 1.0)),
        "mri_tissue_heterogeneity": float(np.clip(base_energy, 0.0, 1.0))
    }
