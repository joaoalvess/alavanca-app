import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  Inbox,
  ChevronDown,
  Target,
  Lightbulb,
  Star,
  Link,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { useAppStore } from '../stores/app-store';
import type { ResumeRecord, StructuredResume, AtsScore, LinkedInScore } from '../types';

export function ResumesPage() {
  const api = useElectronAPI();
  const navigate = useNavigate();
  const { setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId } =
    useAppStore();

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // LinkedIn import state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [importingLinkedin, setImportingLinkedin] = useState(false);

  // ATS Score state
  const [targetRole, setTargetRole] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [atsScores, setAtsScores] = useState<Map<number, AtsScore>>(new Map());
  const [linkedInScores, setLinkedInScores] = useState<Map<number, LinkedInScore>>(new Map());
  const [scoringResumeIds, setScoringResumeIds] = useState<Set<number>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const records = await api.getResumes();
      setResumes(records);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadJobTitles = useCallback(async () => {
    try {
      const titles = await api.getDistinctJobTitles();
      setJobTitles(titles);
    } catch {
      // silently handle
    }
  }, [api]);

  useEffect(() => {
    loadResumes();
    loadJobTitles();
  }, [loadResumes, loadJobTitles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load cached ATS scores and LinkedIn scores when targetRole changes
  useEffect(() => {
    if (!targetRole.trim()) {
      setAtsScores(new Map());
      setLinkedInScores(new Map());
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
          const atsMap = new Map<number, AtsScore>();
          for (const s of ats) atsMap.set(s.resumeId, s);
          setAtsScores(atsMap);
          const liMap = new Map<number, LinkedInScore>();
          for (const s of linkedin) liMap.set(s.resumeId, s);
          setLinkedInScores(liMap);
        }
      } catch {
        // silently handle
      }
    })();
    return () => { cancelled = true; };
  }, [targetRole, api]);

  const handleComputeScore = useCallback(
    async (resumeId: number) => {
      const role = targetRole.trim();
      if (!role) return;
      setScoringResumeIds((prev) => new Set(prev).add(resumeId));
      try {
        const score = await api.computeAtsScore(resumeId, role);
        setAtsScores((prev) => {
          const next = new Map(prev);
          next.set(resumeId, score);
          return next;
        });
        // Refresh job titles in case this is a new role
        loadJobTitles();
      } catch {
        // silently handle
      } finally {
        setScoringResumeIds((prev) => {
          const next = new Set(prev);
          next.delete(resumeId);
          return next;
        });
      }
    },
    [api, targetRole, loadJobTitles]
  );

  const handleComputeLinkedInScore = useCallback(
    async (resumeId: number) => {
      const role = targetRole.trim();
      if (!role) return;
      setScoringResumeIds((prev) => new Set(prev).add(resumeId));
      try {
        const score = await api.computeLinkedInScore(resumeId, role);
        setLinkedInScores((prev) => {
          const next = new Map(prev);
          next.set(resumeId, score);
          return next;
        });
        loadJobTitles();
      } catch {
        // silently handle
      } finally {
        setScoringResumeIds((prev) => {
          const next = new Set(prev);
          next.delete(resumeId);
          return next;
        });
      }
    },
    [api, targetRole, loadJobTitles]
  );

  const handleSelectRole = useCallback((role: string) => {
    setTargetRole(role);
    setShowDropdown(false);
  }, []);

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

  const handleImportLinkedin = useCallback(async () => {
    const url = linkedinUrl.trim();
    if (!url) return;
    setImportingLinkedin(true);
    setError(null);
    try {
      await api.importLinkedInProfile(url);
      setLinkedinUrl('');
      await loadResumes();
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar perfil do LinkedIn');
    } finally {
      setImportingLinkedin(false);
    }
  }, [api, linkedinUrl, loadResumes]);

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      try {
        await api.deleteResume(id);
        setResumes((prev) => prev.filter((r) => r.id !== id));
        setAtsScores((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setLinkedInScores((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      } catch {
        // silently handle
      } finally {
        setDeletingId(null);
      }
    },
    [api]
  );

  const handleOptimize = useCallback(
    (record: ResumeRecord) => {
      const structured = JSON.parse(record.structured) as StructuredResume;
      setResumeText(record.rawText);
      setResumeFilename(record.filename);
      setCurrentResume(structured);
      setSelectedResumeId(record.id);
      navigate('/optimize');
    },
    [navigate, setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId]
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const parseStructured = (json: string): StructuredResume | null => {
    try {
      return JSON.parse(json) as StructuredResume;
    } catch {
      return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/15 border-emerald-500/30';
    if (score >= 50) return 'bg-yellow-500/15 border-yellow-500/30';
    return 'bg-red-500/15 border-red-500/30';
  };

  const isLinkedInProfile = (filename: string) =>
    filename.startsWith('https://www.linkedin.com/in/');

  const filteredTitles = jobTitles.filter((t) =>
    t.toLowerCase().includes(targetRole.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-400" />
            Curriculos
          </h1>
          <p className="mt-2 text-zinc-400">
            Gerencie seus curriculos salvos e reutilize-os nas otimizacoes.
          </p>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 font-medium transition-colors flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Importar Curriculo
            </>
          )}
        </button>
      </div>

      {/* LinkedIn Import */}
      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          onClick={handleImportLinkedin}
          disabled={importingLinkedin || !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')}
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 border border-zinc-700 shrink-0"
        >
          {importingLinkedin ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Link className="w-4 h-4" />
              Importar LinkedIn
            </>
          )}
        </button>
      </div>

      {/* Target Role Combobox */}
      <div ref={comboboxRef} className="relative max-w-md">
        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
          <Target className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Cargo alvo
        </label>
        <div className="relative">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Ex: Software Engineer, Product Manager..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pr-8"
          />
          {jobTitles.length > 0 && (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
        {showDropdown && filteredTitles.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filteredTitles.map((title) => (
              <button
                key={title}
                onClick={() => handleSelectRole(title)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-lg text-zinc-400">Nenhum curriculo salvo</p>
          <p className="text-sm text-zinc-500 mt-1">
            Importe seu primeiro curriculo clicando no botao acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((record) => {
            const structured = parseStructured(record.structured);
            const isLinkedin = isLinkedInProfile(record.filename);
            const atsScore = atsScores.get(record.id);
            const linkedInScore = linkedInScores.get(record.id);
            const isScoring = scoringResumeIds.has(record.id);
            const hasRole = targetRole.trim().length > 0;

            return (
              <div
                key={record.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-zinc-100 truncate">
                      {structured?.contactInfo.name || record.filename}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate">
                      {record.filename}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={deletingId === record.id}
                    className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {structured && structured.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {structured.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {structured.skills.length > 6 && (
                      <span className="text-xs text-zinc-600">
                        +{structured.skills.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {/* Score Section — LinkedIn or ATS depending on source */}
                {hasRole && (
                  <div className="pt-1">
                    {isScoring ? (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        Avaliando para &ldquo;{targetRole}&rdquo;...
                      </div>
                    ) : isLinkedin ? (
                      linkedInScore ? (
                        <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 space-y-3">
                          <div className="flex gap-3">
                            <div className={`flex-1 rounded-lg border p-2.5 ${getScoreBg(linkedInScore.visibilityScore)}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Target className="w-3 h-3 text-zinc-400" />
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Visibilidade</span>
                              </div>
                              <span className={`text-2xl font-bold ${getScoreColor(linkedInScore.visibilityScore)}`}>
                                {linkedInScore.visibilityScore}
                              </span>
                            </div>
                            <div className={`flex-1 rounded-lg border p-2.5 ${getScoreBg(linkedInScore.impactScore)}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Star className="w-3 h-3 text-zinc-400" />
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Impacto</span>
                              </div>
                              <span className={`text-2xl font-bold ${getScoreColor(linkedInScore.impactScore)}`}>
                                {linkedInScore.impactScore}
                              </span>
                            </div>
                          </div>
                          {linkedInScore.tips.length > 0 && (
                            <ul className="space-y-1">
                              {linkedInScore.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-300">
                                  <Lightbulb className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleComputeLinkedInScore(record.id)}
                          className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-600"
                        >
                          <Link className="w-3.5 h-3.5" />
                          Avaliar LinkedIn
                        </button>
                      )
                    ) : atsScore ? (
                      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 space-y-3">
                        <div className="flex gap-3">
                          <div className={`flex-1 rounded-lg border p-2.5 ${getScoreBg(atsScore.atsScore)}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Target className="w-3 h-3 text-zinc-400" />
                              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ATS</span>
                            </div>
                            <span className={`text-2xl font-bold ${getScoreColor(atsScore.atsScore)}`}>
                              {atsScore.atsScore}
                            </span>
                          </div>
                          <div className={`flex-1 rounded-lg border p-2.5 ${getScoreBg(atsScore.qualityScore)}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Star className="w-3 h-3 text-zinc-400" />
                              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Qualidade</span>
                            </div>
                            <span className={`text-2xl font-bold ${getScoreColor(atsScore.qualityScore)}`}>
                              {atsScore.qualityScore}
                            </span>
                          </div>
                        </div>
                        {atsScore.tips.length > 0 && (
                          <ul className="space-y-1">
                            {atsScore.tips.slice(0, 5).map((tip, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-300">
                                <Lightbulb className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleComputeScore(record.id)}
                        className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-600"
                      >
                        <Target className="w-3.5 h-3.5" />
                        Avaliar
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-zinc-600">
                    {formatDate(record.createdAt)}
                  </span>
                  <button
                    onClick={() => handleOptimize(record)}
                    className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Otimizar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
