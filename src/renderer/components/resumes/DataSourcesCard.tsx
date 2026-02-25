import { useState } from 'react';
import { FileText, Linkedin, Upload, Loader2, Link, ExternalLink } from 'lucide-react';
import type { ResumeRecord } from '../../types';

interface DataSourcesCardProps {
  primaryResume: ResumeRecord | null;
  primaryLinkedIn: ResumeRecord | null;
  otherCount: number;
  uploading: boolean;
  onUpload: () => Promise<void>;
  onImportLinkedin: (url: string) => Promise<void>;
  onViewResume: (id: number) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getLinkedInSlug(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^/]+)/);
  return match ? match[1] : url;
}

export function DataSourcesCard({
  primaryResume,
  primaryLinkedIn,
  otherCount,
  uploading,
  onUpload,
  onImportLinkedin,
  onViewResume,
}: DataSourcesCardProps) {
  const [showLinkedinInput, setShowLinkedinInput] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    const url = linkedinUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      await onImportLinkedin(url);
      setLinkedinUrl('');
      setShowLinkedinInput(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Resume card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-300">Curriculo</span>
          </div>
          {primaryResume ? (
            <div>
              <p className="text-sm text-zinc-100 truncate">{primaryResume.filename}</p>
              <p className="text-xs text-zinc-500 mt-1">{formatDate(primaryResume.createdAt)}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={onUpload}
                  disabled={uploading}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 transition-colors border border-zinc-700 hover:border-zinc-600 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  Substituir
                </button>
                <button
                  onClick={() => onViewResume(primaryResume.id)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 transition-colors border border-zinc-700 hover:border-zinc-600 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver detalhes
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onUpload}
              disabled={uploading}
              className="w-full mt-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/25 rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Importar Curriculo
            </button>
          )}
        </div>

        {/* LinkedIn card */}
        <div className="bg-zinc-900 border border-blue-500/25 rounded-xl p-5 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Linkedin className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-zinc-300">LinkedIn</span>
          </div>
          {primaryLinkedIn ? (
            <div>
              <p className="text-sm text-zinc-100 truncate">{getLinkedInSlug(primaryLinkedIn.filename)}</p>
              <p className="text-xs text-zinc-500 mt-1">{formatDate(primaryLinkedIn.createdAt)}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setShowLinkedinInput(true)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 transition-colors border border-zinc-700 hover:border-zinc-600"
                >
                  Atualizar
                </button>
                <button
                  onClick={() => onViewResume(primaryLinkedIn.id)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 transition-colors border border-zinc-700 hover:border-zinc-600 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver detalhes
                </button>
              </div>
            </div>
          ) : !showLinkedinInput ? (
            <button
              onClick={() => setShowLinkedinInput(true)}
              className="w-full mt-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              Importar LinkedIn
            </button>
          ) : null}
          {showLinkedinInput && !primaryLinkedIn && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://www.linkedin.com/in/..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImport}
                  disabled={importing || !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1"
                >
                  {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
                  Importar
                </button>
                <button
                  onClick={() => { setShowLinkedinInput(false); setLinkedinUrl(''); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {showLinkedinInput && primaryLinkedIn && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://www.linkedin.com/in/..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImport}
                  disabled={importing || !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1"
                >
                  {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
                  Atualizar
                </button>
                <button
                  onClick={() => { setShowLinkedinInput(false); setLinkedinUrl(''); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {otherCount > 0 && (
        <p className="text-xs text-zinc-500 text-center">
          <button
            onClick={() => {/* navigate handled at parent level */}}
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
          >
            Ver todos os {otherCount + (primaryResume ? 1 : 0) + (primaryLinkedIn ? 1 : 0)} curriculos
          </button>
        </p>
      )}
    </div>
  );
}
