import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { useAppStore } from '../stores/app-store';
import type { ResumeRecord, StructuredResume } from '../types';

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

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

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

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      try {
        await api.deleteResume(id);
        setResumes((prev) => prev.filter((r) => r.id !== id));
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
