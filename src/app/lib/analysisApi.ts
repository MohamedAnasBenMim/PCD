export type DetectedFeature = {
  name: string;
  detected: boolean;
  confidence: number;
};

export type AnalysisResult = {
  scanId: string;
  patientId: string;
  patientName?: string;
  date: string;
  time: string;
  eye: string;
  severity: 'No DR' | 'Mild' | 'Moderate' | 'Severe' | string;
  confidence: number;
  detectedFeatures: DetectedFeature[];
  imageUrl?: string;
};

export type AiPrediction = {
  class_id: number;
  severity: string;
  is_diabetic: boolean;
  confidence: number;
};

export type ScanSummary = {
  scanId: string;
  patientId: string;
  patientName?: string | null;
  patient?: string;
  date: string;
  time: string;
  eye: string;
  scanType?: string;
  notes?: string | null;
  severity: string;
  confidence: number;
  status: 'completed' | 'review' | 'urgent' | string;
};

export async function analyzeImage(formData: FormData): Promise<AiPrediction> {
  const endpoint = import.meta.env.VITE_ANALYZE_API_URL || 'http://localhost:5000/api/analyze';
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Analysis failed. Please try again.';
    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.detail?.detail || errorBody.detail || message;
    } catch {
      message = await response.text() || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function analyzeRetinalImage(formData: FormData): Promise<AnalysisResult> {
  const endpoint = import.meta.env.VITE_ANALYSIS_API_URL || 'http://localhost:5000/api/analysis';
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Analysis failed. Please try again.';
    try {
      const errorBody = await response.json();
      message = errorBody.detail || errorBody.message || message;
    } catch {
      message = await response.text() || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchScans(limit = 50): Promise<ScanSummary[]> {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const endpoint = `${apiBase}/api/scans?limit=${encodeURIComponent(limit)}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error('Failed to load scans. Please try again.');
  }

  return response.json();
}
