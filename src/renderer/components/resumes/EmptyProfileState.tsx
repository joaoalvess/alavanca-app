import { useState } from 'react';
import { UserCircle, Upload, Loader2, Link } from 'lucide-react';

interface EmptyProfileStateProps {
  uploading: boolean;
  onUpload: () => Promise<void>;
  onImportLinkedin: (url: string) => Promise<void>;
}

export function EmptyProfileState({ uploading, onUpload, onImportLinkedin }: EmptyProfileStateProps) {
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    const url = linkedinUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      await onImportLinkedin(url);
      setLinkedinUrl('');
      setShowLinkedin(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <UserCircle className="w-20 h-20 text-zinc-700 mb-6" />
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Configure seu perfil de carreira</h2>
      <p className="text-sm text-zinc-400 mb-8 max-w-md">
        Importe seu curriculo ou perfil do LinkedIn para comecar a avaliar e otimizar sua carreira.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onUpload}
          disabled={uploading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center gap-2 text-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Importar Curriculo
            </>
          )}
        </button>

        {showLinkedin ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              placeholder="https://www.linkedin.com/in/..."
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors w-72"
              autoFocus
            />
            <button
              onClick={handleImport}
              disabled={importing || !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              Importar
            </button>
            <button
              onClick={() => { setShowLinkedin(false); setLinkedinUrl(''); }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors px-2 py-3"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLinkedin(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Link className="w-5 h-5" />
            Importar LinkedIn
          </button>
        )}
      </div>
    </div>
  );
}
