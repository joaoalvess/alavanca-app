import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { useAppStore } from '../stores/app-store';
import { ProfileHeader } from '../components/resumes/ProfileHeader';
import { ScorePanel } from '../components/resumes/ScorePanel';
import { DataSourcesCard } from '../components/resumes/DataSourcesCard';
import { EmptyProfileState } from '../components/resumes/EmptyProfileState';
import type { ResumeRecord, StructuredResume, AtsScore, LinkedInScore } from '../types';

const noop = () => { /* no-op */ };

function getCurrentRole(structured: StructuredResume): string | null {
  const exp = structured.experience[0];
  if (!exp) return null;
  return `${exp.title}${exp.company ? ` @ ${exp.company}` : ''}`;
}

export function ResumesPage() {
  const api = useElectronAPI();
  const navigate = useNavigate();
  const { setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId } =
    useAppStore();

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scoring state
  const [targetRole, setTargetRole] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [linkedInScore, setLinkedInScore] = useState<LinkedInScore | null>(null);
  const [isScoringAts, setIsScoringAts] = useState(false);
  const [isScoringLinkedIn, setIsScoringLinkedIn] = useState(false);

  // Derived values
  const { primaryResume, primaryLinkedIn, otherCount } = useMemo(() => {
    const resumeRecords = resumes.filter(
      (r) => !r.filename.startsWith('https://www.linkedin.com')
    );
    const linkedInRecords = resumes.filter(
      (r) => r.filename.startsWith('https://www.linkedin.com')
    );
    return {
      primaryResume: resumeRecords[0] ?? null,
      primaryLinkedIn: linkedInRecords[0] ?? null,
      otherCount: Math.max(0, resumeRecords.length - 1) + Math.max(0, linkedInRecords.length - 1),
    };
  }, [resumes]);

  // Merge identity from both sources, preferring LinkedIn
  const { displayName, currentRole, email, location } = useMemo(() => {
    let linkedInStructured: StructuredResume | null = null;
    let resumeStructured: StructuredResume | null = null;

    if (primaryLinkedIn) {
      try { linkedInStructured = JSON.parse(primaryLinkedIn.structured) as StructuredResume; } catch { /* */ }
    }
    if (primaryResume) {
      try { resumeStructured = JSON.parse(primaryResume.structured) as StructuredResume; } catch { /* */ }
    }

    const primary = linkedInStructured ?? resumeStructured;
    const fallback = resumeStructured ?? linkedInStructured;

    const name = primary?.contactInfo.name || fallback?.contactInfo.name || 'Meu Perfil';
    const role = primary ? getCurrentRole(primary) : fallback ? getCurrentRole(fallback) : null;
    const emailVal = primary?.contactInfo.email || fallback?.contactInfo.email || null;
    const loc = primary?.contactInfo.location || fallback?.contactInfo.location || null;

    return { displayName: name, currentRole: role, email: emailVal, location: loc };
  }, [primaryLinkedIn, primaryResume]);

  const hasTargetRole = targetRole.trim().length > 0;

  // Load resumes + job titles on mount
  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const [records, titles] = await Promise.all([
        api.getResumes(),
        api.getDistinctJobTitles(),
      ]);
      setResumes(records);
      setJobTitles(titles);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Load cached scores when targetRole changes
  useEffect(() => {
    if (!targetRole.trim()) {
      setAtsScore(null);
      setLinkedInScore(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ats, linkedin] = await Promise.all([
          api.getAtsScores(targetRole.trim()),
          api.getLinkedInScores(targetRole.trim()),
        ]);
        if (!cancelled) {
          setAtsScore(
            primaryResume ? (ats.find((s) => s.resumeId === primaryResume.id) ?? null) : null
          );
          setLinkedInScore(
            primaryLinkedIn ? (linkedin.find((s) => s.resumeId === primaryLinkedIn.id) ?? null) : null
          );
        }
      } catch {
        // silently handle
      }
    })();
    return () => { cancelled = true; };
  }, [targetRole, api, primaryResume, primaryLinkedIn]);

  const handleUpload = useCallback(async () => {
    setUploading(true);
    setError(null);
    try {
      const filePath = await api.selectResumeFile();
      if (!filePath) {
        setUploading(false);
        return;
      }
      const result = await api.parseResume(filePath);
      const structured = await api.structureResume(result.text);
      await api.saveResume(result.filename, result.text, structured);
      await loadResumes();
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar curriculo');
    } finally {
      setUploading(false);
    }
  }, [api, loadResumes]);

  const handleImportLinkedin = useCallback(async (url: string) => {
    setError(null);
    try {
      await api.importLinkedInProfile(url);
      await loadResumes();
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar perfil do LinkedIn');
    }
  }, [api, loadResumes]);

  const handleComputeAts = useCallback(async () => {
    const role = targetRole.trim();
    if (!role || !primaryResume) return;
    setIsScoringAts(true);
    try {
      const score = await api.computeAtsScore(primaryResume.id, role);
      setAtsScore(score);
      const titles = await api.getDistinctJobTitles();
      setJobTitles(titles);
    } catch {
      // silently handle
    } finally {
      setIsScoringAts(false);
    }
  }, [api, primaryResume, targetRole]);

  const handleComputeLinkedIn = useCallback(async () => {
    const role = targetRole.trim();
    if (!role || !primaryLinkedIn) return;
    setIsScoringLinkedIn(true);
    try {
      const score = await api.computeLinkedInScore(primaryLinkedIn.id, role);
      setLinkedInScore(score);
      const titles = await api.getDistinctJobTitles();
      setJobTitles(titles);
    } catch {
      // silently handle
    } finally {
      setIsScoringLinkedIn(false);
    }
  }, [api, primaryLinkedIn, targetRole]);

  const handleOptimize = useCallback(() => {
    if (!primaryResume) return;
    try {
      const s = JSON.parse(primaryResume.structured) as StructuredResume;
      setResumeText(primaryResume.rawText);
      setResumeFilename(primaryResume.filename);
      setCurrentResume(s);
      setSelectedResumeId(primaryResume.id);
      navigate('/optimize');
    } catch {
      // silently handle
    }
  }, [primaryResume, navigate, setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId]);

  const handleViewResume = useCallback((id: number) => {
    navigate(`/resumes/${id}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}
        <EmptyProfileState
          uploading={uploading}
          onUpload={handleUpload}
          onImportLinkedin={handleImportLinkedin}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <ProfileHeader
        displayName={displayName}
        currentRole={currentRole}
        email={email}
        location={location}
        primaryResume={primaryResume}
        primaryLinkedIn={primaryLinkedIn}
        targetRole={targetRole}
        onTargetRoleChange={setTargetRole}
        jobTitles={jobTitles}
      />

      {/* Score Panel */}
      <ScorePanel
        atsScore={atsScore}
        linkedInScore={linkedInScore}
        isScoringAts={isScoringAts}
        isScoringLinkedIn={isScoringLinkedIn}
        hasTargetRole={hasTargetRole}
        onComputeAts={primaryResume ? handleComputeAts : noop}
        onComputeLinkedIn={primaryLinkedIn ? handleComputeLinkedIn : noop}
      />

      {/* Data Sources */}
      <DataSourcesCard
        primaryResume={primaryResume}
        primaryLinkedIn={primaryLinkedIn}
        otherCount={otherCount}
        uploading={uploading}
        onUpload={handleUpload}
        onImportLinkedin={handleImportLinkedin}
        onViewResume={handleViewResume}
      />

      {/* Quick action: Optimize */}
      {primaryResume && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleOptimize}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 py-3 font-medium transition-colors flex items-center gap-2 text-sm shadow-lg shadow-emerald-900/20"
          >
            <Sparkles className="w-5 h-5" />
            Otimizar Curriculo
          </button>
        </div>
      )}
    </div>
  );
}
