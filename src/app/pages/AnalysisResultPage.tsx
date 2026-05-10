import { GlassCard } from '../components/GlassCard';
import {
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye,
  Calendar,
  Clock,
  User,
  Share2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import type { AnalysisResult } from '../lib/analysisApi';

export function AnalysisResultPage() {
  const { id } = useParams();
  const fallbackResult: AnalysisResult = {
    scanId: 'SCN-2848',
    patientId: 'PAT-12345',
    patientName: 'Sarah Johnson',
    date: '2026-04-13',
    time: '14:32',
    eye: 'Left Eye (OS)',
    severity: 'Moderate',
    confidence: 91.3,
    detectedFeatures: [
      { name: 'Microaneurysms', detected: true, confidence: 94.2 },
      { name: 'Hemorrhages', detected: true, confidence: 88.5 },
      { name: 'Hard Exudates', detected: true, confidence: 91.7 },
      { name: 'Soft Exudates', detected: false, confidence: 12.3 },
      { name: 'Neovascularization', detected: false, confidence: 8.1 },
    ],
  };
  const result = useMemo(() => {
    if (!id) return fallbackResult;
    const stored = sessionStorage.getItem(`analysis:${id}`);
    if (!stored) return { ...fallbackResult, scanId: id };

    try {
      return JSON.parse(stored) as AnalysisResult;
    } catch {
      return { ...fallbackResult, scanId: id };
    }
  }, [id]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'No DR':
        return {
          bg: 'bg-[var(--success-green)]/10',
          text: 'text-[var(--success-green)]',
          border: 'border-[var(--success-green)]/30',
        };
      case 'Mild':
        return {
          bg: 'bg-[var(--info-blue)]/10',
          text: 'text-[var(--info-blue)]',
          border: 'border-[var(--info-blue)]/30',
        };
      case 'Moderate':
        return {
          bg: 'bg-[var(--warning-yellow)]/10',
          text: 'text-[var(--warning-yellow)]',
          border: 'border-[var(--warning-yellow)]/30',
        };
      case 'Severe':
        return {
          bg: 'bg-[var(--error-red)]/10',
          text: 'text-[var(--error-red)]',
          border: 'border-[var(--error-red)]/30',
        };
      default:
        return {
          bg: 'bg-[var(--muted)]/10',
          text: 'text-[var(--muted-foreground)]',
          border: 'border-[var(--muted)]/30',
        };
    }
  };

  const severityColors = getSeverityColor(result.severity);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Analysis Result
            </h1>
            <span className="text-lg text-[var(--muted-foreground)]">{result.scanId}</span>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Diabetic retinopathy detection results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button className="bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)]">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Image */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg mb-4" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Retinal Fundus Image
            </h2>
            <div className="relative rounded-xl overflow-hidden border border-[var(--glass-border)]">
              <ImageWithFallback
                src={result.imageUrl || "https://images.unsplash.com/photo-1731582779780-45d305d5fd12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxyZXRpbmFsJTIwZnVuZHVzJTIwbWVkaWNhbHxlbnwxfHx8fDE3NzYxMTM4NTd8MA&ixlib=rb-4.1.0&q=80&w=1080"}
                alt="Retinal scan"
                className="w-full h-auto"
              />
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm">
                {result.eye}
              </div>
            </div>
          </GlassCard>

          {/* Detected Features */}
          <GlassCard className="p-6">
            <h2 className="text-lg mb-4" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Detected Features
            </h2>
            <div className="space-y-3">
              {result.detectedFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                >
                  <div className="flex items-center gap-3">
                    {feature.detected ? (
                      <div className="w-8 h-8 rounded-full bg-[var(--warning-yellow)]/10 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-[var(--warning-yellow)]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--success-green)]/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[var(--success-green)]" />
                      </div>
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {feature.confidence.toFixed(1)}%
                    </div>
                    <div className="w-24 h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          feature.detected
                            ? 'bg-[var(--warning-yellow)]'
                            : 'bg-[var(--success-green)]'
                        }`}
                        style={{ width: `${feature.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Severity Card */}
          <GlassCard className={`p-6 border-2 ${severityColors.border}`}>
            <div className="text-center">
              <div className="text-sm text-[var(--muted-foreground)] mb-2">Diagnosis</div>
              <div
                className={`text-4xl mb-4 ${severityColors.text}`}
                style={{ fontFamily: 'Outfit', fontWeight: 700 }}
              >
                {result.severity}
              </div>
              <div className="text-sm text-[var(--muted-foreground)] mb-4">
                Diabetic Retinopathy
              </div>

              {/* Severity Scale */}
              <div className="pt-4 border-t border-[var(--glass-border)]">
                <div className="text-xs text-[var(--muted-foreground)] mb-3">Severity Scale</div>
                <div className="flex gap-1">
                  {['No DR', 'Mild', 'Moderate', 'Severe'].map((level, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        level === result.severity
                          ? severityColors.bg
                          : 'bg-[var(--glass-bg)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-xs text-[var(--muted-foreground)]">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Patient Info */}
          <GlassCard className="p-6">
            <h3 className="text-sm mb-4" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Patient Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Patient:</span>
                <span className="ml-auto">{result.patientName || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">ID:</span>
                <span className="ml-auto">{result.patientId}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Eye:</span>
                <span className="ml-auto">{result.eye}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Date:</span>
                <span className="ml-auto">{result.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Time:</span>
                <span className="ml-auto">{result.time}</span>
              </div>
            </div>
          </GlassCard>

          {/* Recommendations */}
          <GlassCard className="p-6">
            <h3 className="text-sm mb-4" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Clinical Recommendations
            </h3>
            <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--clinical-blue)] mt-1.5"></div>
                <span>Schedule follow-up examination within 3-6 months</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--clinical-blue)] mt-1.5"></div>
                <span>Monitor blood glucose levels closely</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--clinical-blue)] mt-1.5"></div>
                <span>Consider referral to retinal specialist</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--clinical-blue)] mt-1.5"></div>
                <span>Document findings in patient medical record</span>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-[var(--glass-border)] bg-[var(--glass-bg)]"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Detailed Report
            </Button>
            <Button
              variant="outline"
              className="w-full border-[var(--glass-border)] bg-[var(--glass-bg)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
