import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Save,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { useAppStore } from '../stores/app-store';
import { cn } from '../lib/utils';
import type { StructuredResume, ResumeRecord } from '../types';

type OptimizeStep = 'idle' | 'structuring' | 'analyzing' | 'optimizing' | 'done';

export function OptimizePage() {
  const api = useElectronAPI();
  const {
    resumeText,
    resumeFilename,
    jobDescription,
    currentResume,
    currentJob,
    currentOptimization,
    isOptimizing,
    selectedResumeId,
    setResumeText,
    setResumeFilename,
    setJobDescription,
    setCurrentResume,
    setCurrentJob,
    setCurrentOptimization,
    setIsOptimizing,
    setSelectedResumeId,
  } = useAppStore();

  const [step, setStep] = useState<OptimizeStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [savedResumes, setSavedResumes] = useState<ResumeRecord[]>([]);

  useEffect(() => {
    api.getResumes().then(setSavedResumes).catch(() => { /* ignore */ });
  }, [api]);

  const handleSelectFile = useCallback(async () => {
    try {
      const filePath = await api.selectResumeFile();
      if (!filePath) return;
      const result = await api.parseResume(filePath);
      setResumeText(result.text);
      setResumeFilename(result.filename);
      setSelectedResumeId(null);
      setCurrentResume(null);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar arquivo');
    }
  }, [api, setResumeText, setResumeFilename, setSelectedResumeId, setCurrentResume]);

  const handleSelectSavedResume = useCallback(
    (record: ResumeRecord) => {
      const structured = JSON.parse(record.structured) as StructuredResume;
      setResumeText(record.rawText);
      setResumeFilename(record.filename);
      setCurrentResume(structured);
      setSelectedResumeId(record.id);
      setError(null);
    },
    [setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId]
  );

  const handleScrapeUrl = useCallback(async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const text = await api.scrapeJobUrl(scrapeUrl.trim());
      setJobDescription(text);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar vaga pela URL');
    } finally {
      setIsScraping(false);
    }
  }, [api, scrapeUrl, setJobDescription]);

  const handleOptimize = useCallback(async () => {
    if (!resumeText || !jobDescription) return;
    setError(null);
    setIsOptimizing(true);
    setCurrentOptimization(null);
    setSaved(false);

    try {
      // Step 1: Structure resume (skip if already structured from saved resume)
      let structured: StructuredResume;
      if (selectedResumeId && currentResume) {
        structured = currentResume;
      } else {
        setStep('structuring');
        structured = await api.structureResume(resumeText);
        setCurrentResume(structured);
      }

      // Step 2: Extract job requirements
      setStep('analyzing');
      const requirements = await api.extractJobRequirements(jobDescription);
      setCurrentJob(requirements);

      // Step 3: Optimize
      setStep('optimizing');
      const result = await api.optimizeResume(structured, requirements);
      setCurrentOptimization(result);
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Erro durante a otimizacao');
      setStep('idle');
    } finally {
      setIsOptimizing(false);
    }
  }, [
    api,
    resumeText,
    jobDescription,
    setIsOptimizing,
    setCurrentResume,
    setCurrentJob,
    setCurrentOptimization,
  ]);

  const handleSave = useCallback(async () => {
    if (!currentResume || !currentJob || !currentOptimization) return;
    try {
      const resumeId = await api.saveResume(
        resumeFilename,
        resumeText,
        currentResume
      );
      const jobId = await api.saveJob(
        currentJob.title,
        currentJob.company,
        jobDescription,
        currentJob
      );
      await api.saveOptimization(resumeId, jobId, currentOptimization);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar');
    }
  }, [
    api,
    currentResume,
    currentJob,
    currentOptimization,
    resumeFilename,
    resumeText,
    jobDescription,
  ]);

  const handleExportPdf = useCallback(async () => {
    if (!currentOptimization) return;
    try {
      await api.exportPdf(currentOptimization.optimizedResume);
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar PDF');
    }
  }, [api, currentOptimization]);

  const handleExportDocx = useCallback(async () => {
    if (!currentOptimization) return;
    try {
      await api.exportDocx(currentOptimization.optimizedResume);
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar DOCX');
    }
  }, [api, currentOptimization]);

  const stepLabels: Record<OptimizeStep, string> = {
    idle: '',
    structuring: 'Estruturando curriculo...',
    analyzing: 'Analisando vaga...',
    optimizing: 'Otimizando curriculo...',
    done: 'Concluido!',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">
          Otimizar Curriculo
        </h1>
        <p className="mt-2 text-zinc-400">
          Envie seu curriculo e a descricao da vaga para receber uma analise
          detalhada e sugestoes de otimizacao.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-red-300">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Upload */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            1. Curriculo
          </h2>

          {!resumeText ? (
            <div className="space-y-4">
              {/* Saved resumes selector */}
              {savedResumes.length > 0 && (
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">
                    Selecionar curriculo salvo
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedResumes.map((r) => {
                      let name = r.filename;
                      try {
                        const parsed = JSON.parse(r.structured);
                        if (parsed.contactInfo?.name) name = parsed.contactInfo.name;
                      } catch { /* ignore */ }
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSelectSavedResume(r)}
                          className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg px-4 py-3 text-left transition-colors"
                        >
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-zinc-200 truncate">{name}</p>
                            <p className="text-xs text-zinc-500 truncate">{r.filename}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-zinc-900 px-2 text-zinc-500">ou</span>
                    </div>
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
                  dragOver
                    ? 'border-emerald-500 bg-emerald-600/5'
                    : 'border-zinc-700 hover:border-zinc-600'
                )}
                onClick={handleSelectFile}
              >
                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-300 font-medium">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-sm text-zinc-500 mt-1">PDF ou DOCX</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-zinc-200">
                    {resumeFilename}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setResumeText('');
                    setResumeFilename('');
                    setSelectedResumeId(null);
                    setCurrentResume(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                  {resumeText.slice(0, 500)}
                  {resumeText.length > 500 && '...'}
                </pre>
              </div>
              <button
                onClick={handleSelectFile}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Trocar arquivo
              </button>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            2. Descricao da Vaga
          </h2>

          {/* URL Scraper */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="Cole a URL da vaga (opcional)"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>
            <button
              onClick={handleScrapeUrl}
              disabled={isScraping || !scrapeUrl.trim()}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-1"
            >
              {isScraping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Cole aqui a descricao completa da vaga..."
            rows={10}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Optimize Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleOptimize}
          disabled={!resumeText || !jobDescription || isOptimizing}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center gap-2"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {stepLabels[step]}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Otimizar Curriculo
            </>
          )}
        </button>

        {/* Step Progress */}
        {isOptimizing && (
          <div className="flex items-center gap-2">
            {(['structuring', 'analyzing', 'optimizing'] as const).map(
              (s, i) => (
                <div
                  key={s}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    step === s
                      ? 'bg-emerald-500 animate-pulse'
                      : step === 'done' ||
                        ['structuring', 'analyzing', 'optimizing'].indexOf(
                          step
                        ) > i
                      ? 'bg-emerald-600'
                      : 'bg-zinc-700'
                  )}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {currentOptimization && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-100">Resultado</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={
                      currentOptimization.overallScore >= 80
                        ? '#10b981'
                        : currentOptimization.overallScore >= 60
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      (currentOptimization.overallScore / 100) * 327
                    } 327`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-zinc-100">
                    {currentOptimization.overallScore}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Pontuacao Geral
              </p>
            </div>

            {/* Section Scores */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
              <h3 className="font-semibold text-zinc-100 mb-4">
                Pontuacao por Secao
              </h3>
              <div className="space-y-3">
                {currentOptimization.sectionScores.map((s) => (
                  <div key={s.section}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-300">{s.section}</span>
                      <span className="text-zinc-400">{s.score}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          s.score >= 80
                            ? 'bg-emerald-500'
                            : s.score >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        )}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    {s.suggestions.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {s.suggestions.map((sug, i) => (
                          <li
                            key={i}
                            className="text-xs text-zinc-500 pl-2 border-l border-zinc-700"
                          >
                            {sug}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keyword Analysis */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">
              Analise de Palavras-chave
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {currentOptimization.keywordAnalysis.map((kw) => (
                <div
                  key={kw.keyword}
                  className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2"
                >
                  {kw.found ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-sm text-zinc-300 truncate">
                    {kw.keyword}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Changes Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">
              Resumo das Alteracoes
            </h3>
            <ul className="space-y-2">
              {currentOptimization.changesSummary.map((change, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportPdf}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportDocx}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar DOCX
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2',
                saved
                  ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              )}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvo no historico
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar no historico
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
