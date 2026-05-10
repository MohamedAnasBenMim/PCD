import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Upload, X, FileCheck, Eye, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { analyzeImage, type AiPrediction } from '../lib/analysisApi';

export function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [scanType, setScanType] = useState('Fundus Photography');
  const [eye, setEye] = useState('Left Eye (OS)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select a retinal image.');
      setSelectedFile(null);
      setPreview(null);
      setPrediction(null);
      return;
    }

    setError(null);
    setPrediction(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setPrediction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('No image selected. Please choose a retinal image first.');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('Invalid file type. Please select a retinal image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPrediction(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('patientName', patientName);
    formData.append('patientId', patientId);
    formData.append('scanType', scanType);
    formData.append('eye', eye);
    formData.append('notes', notes);

    try {
      // AI integration: React sends the selected image to Node.js, which forwards it to FastAPI.
      const result = await analyzeImage(formData);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/[0.035] px-3 py-1 text-xs text-[var(--muted-foreground)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--clinical-cyan)]" />
            Secure scan intake
          </div>
          <h1 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
            Upload Retinal Scan
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Upload a high-quality fundus image for AI analysis.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div>
          <GlassCard className="mb-6 overflow-hidden">
            <div className="border-b border-[var(--glass-border)] px-5 py-4">
              <h2 className="text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                Image Upload
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">JPG, PNG, or TIFF files up to 10 MB</p>
            </div>
            <div className="p-5">

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border border-dashed p-8 text-center sm:p-12 ${
                  dragActive
                    ? 'border-[var(--clinical-cyan)] bg-[var(--clinical-cyan)]/10'
                    : 'border-[var(--glass-border)] bg-white/[0.02] hover:border-[var(--clinical-cyan)]/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleChange}
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
                    <Upload className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg text-white">Drop your image here</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    or click to browse files
                  </p>
                  <div className="inline-flex rounded-lg border border-[var(--glass-border)] bg-white/[0.045] px-4 py-2 text-sm">
                    Select File
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border border-[var(--glass-border)] bg-[#050a12]">
                  <img
                    src={preview || ''}
                    alt="Preview"
                    className="h-72 w-full object-contain"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute right-3 top-3 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-strong)]/88 p-2 backdrop-blur-xl hover:bg-[var(--error-red)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-[var(--success-green)]/20 bg-[var(--success-green)]/10 p-4">
                  <FileCheck className="w-5 h-5 text-[var(--success-green)]" />
                  <div className="flex-1">
                    <div className="text-sm">{selectedFile.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm text-white">
              <AlertCircle className="w-4 h-4 text-[var(--info-blue)]" />
              Image Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--clinical-cyan)]"></div>
                <span>Use high-resolution retinal fundus images (minimum 1024x1024)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--clinical-cyan)]"></div>
                <span>Supported formats: JPG, PNG, TIFF</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--clinical-cyan)]"></div>
                <span>Ensure proper focus and adequate lighting</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--clinical-cyan)]"></div>
                <span>Maximum file size: 10 MB</span>
              </li>
            </ul>
          </GlassCard>
        </div>

        <div>
          <GlassCard className="overflow-hidden">
            <div className="border-b border-[var(--glass-border)] px-5 py-4">
              <h2 className="text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                Patient Information
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Attach metadata before analysis</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Sarah Johnson"
                  className="h-11 border-[var(--glass-border)] bg-[var(--input-background)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="PAT-12345"
                    className="h-11 border-[var(--glass-border)] bg-[var(--input-background)] pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scanType">Scan Type</Label>
                <select
                  id="scanType"
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  <option>Fundus Photography</option>
                  <option>OCT Scan</option>
                  <option>Fluorescein Angiography</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eye">Eye</Label>
                <select
                  id="eye"
                  value={eye}
                  onChange={(e) => setEye(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  <option>Left Eye (OS)</option>
                  <option>Right Eye (OD)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant clinical observations..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-4 space-y-3">
                {error && (
                  <div className="rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 px-3 py-2 text-sm text-[var(--error-red)]">
                    {error}
                  </div>
                )}
                {prediction && (
                  <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-3">
                      <span className="text-[var(--muted-foreground)]">Severity</span>
                      <span>{prediction.severity}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-3">
                      <span className="text-[var(--muted-foreground)]">Status</span>
                      <span>{prediction.is_diabetic ? 'Diabetic retinopathy detected' : 'Not diabetic'}</span>
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className="h-12 w-full bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] hover:opacity-95 disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Analyzing...' : 'Analyze Image'}
                </Button>
                <p className="text-xs text-center text-[var(--muted-foreground)]">
                  Analysis typically completes in under 2 seconds
                </p>
              </div>
            </form>
          </GlassCard>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl mb-1 text-[var(--clinical-blue)]" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                99.2%
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Accuracy</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl mb-1 text-[var(--clinical-cyan)]" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                &lt;2s
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Avg. Time</div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
