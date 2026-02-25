import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Inbox,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { cn } from '../lib/utils';
import type { OptimizationRecord, OptimizationResult } from '../types';

export function HistoryPage() {
  const api = useElectronAPI();
  const [optimizations, setOptimizations] = useState<OptimizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedResult, setExpandedResult] =
    useState<OptimizationResult | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadOptimizations = useCallback(async () => {
    setLoading(true);
    try {
      const records = await api.getOptimizations();
      setOptimizations(records);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadOptimizations();
  }, [loadOptimizations]);

  const handleExpand = useCallback(
    async (id: number) => {
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedResult(null);
        return;
      }
      try {
        const record = await api.getOptimization(id);
        if (record) {
          setExpandedId(id);
          setExpandedResult(JSON.parse(record.result) as OptimizationResult);
        }
      } catch {
        // silently handle
      }
    },
    [api, expandedId]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      try {
        await api.deleteOptimization(id);
        setOptimizations((prev) => prev.filter((o) => o.id !== id));
        if (expandedId === id) {
          setExpandedId(null);
          setExpandedResult(null);
        }
      } catch {
        // silently handle
      } finally {
        setDeletingId(null);
      }
    },
    [api, expandedId]
  );

  const handleExportPdf = useCallback(
    async (result: OptimizationResult) => {
      try {
        await api.exportPdf(result.optimizedResume);
      } catch {
        // silently handle
      }
    },
    [api]
  );

  const handleExportDocx = useCallback(
    async (result: OptimizationResult) => {
      try {
        await api.exportDocx(result.optimizedResume);
      } catch {
        // silently handle
      }
    },
    [api]
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <History className="w-8 h-8 text-emerald-400" />
          Historico de Otimizacoes
        </h1>
        <p className="mt-2 text-zinc-400">
          Veja todas as otimizacoes realizadas anteriormente.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : optimizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-lg text-zinc-400">
            Nenhuma otimizacao encontrada
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Realize sua primeira otimizacao na pagina "Otimizar".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {optimizations.map((opt) => (
            <div
              key={opt.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              {/* Row */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => handleExpand(opt.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="text-sm font-medium text-zinc-200 truncate">
                      {opt.resumeFilename || 'Curriculo'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {opt.jobTitle
                      ? `${opt.jobTitle}${
                          opt.jobCompany ? ` - ${opt.jobCompany}` : ''
                        }`
                      : 'Vaga nao especificada'}
                  </p>
                </div>

                <div className="text-sm text-zinc-500 shrink-0">
                  {formatDate(opt.createdAt)}
                </div>

                {/* Score */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2',
                    (opt.overallScore ?? 0) >= 80
                      ? 'border-emerald-500 text-emerald-400'
                      : (opt.overallScore ?? 0) >= 60
                      ? 'border-amber-500 text-amber-400'
                      : 'border-red-500 text-red-400'
                  )}
                >
                  {opt.overallScore ?? '—'}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(opt.id);
                  }}
                  disabled={deletingId === opt.id}
                  className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {expandedId === opt.id ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </div>

              {/* Expanded Details */}
              {expandedId === opt.id && expandedResult && (
                <div className="border-t border-zinc-800 px-6 py-5 space-y-5">
                  {/* Section Scores */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                      Pontuacao por Secao
                    </h4>
                    <div className="space-y-2">
                      {expandedResult.sectionScores.map((s) => (
                        <div key={s.section}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-zinc-400">{s.section}</span>
                            <span className="text-zinc-500">{s.score}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5">
                            <div
                              className={cn(
                                'h-1.5 rounded-full',
                                s.score >= 80
                                  ? 'bg-emerald-500'
                                  : s.score >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              )}
                              style={{ width: `${s.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                      Palavras-chave
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {expandedResult.keywordAnalysis.map((kw) => (
                        <span
                          key={kw.keyword}
                          className={cn(
                            'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md',
                            kw.found
                              ? 'bg-emerald-600/10 text-emerald-400'
                              : 'bg-red-600/10 text-red-400'
                          )}
                        >
                          {kw.found ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {kw.keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Changes */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                      Alteracoes Realizadas
                    </h4>
                    <ul className="space-y-1">
                      {expandedResult.changesSummary.map((c, i) => (
                        <li
                          key={i}
                          className="text-sm text-zinc-400 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Export */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExportPdf(expandedResult)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar PDF
                    </button>
                    <button
                      onClick={() => handleExportDocx(expandedResult)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar DOCX
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
