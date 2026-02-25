import { useState } from 'react';
import { Upload, Loader2, Link } from 'lucide-react';

interface ImportActionsProps {
  onUpload: () => Promise<void>;
  onImportLinkedin: (url: string) => Promise<void>;
  uploading: boolean;
}

export function ImportActions({ onUpload, onImportLinkedin, uploading }: ImportActionsProps) {
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
    <div className="flex items-center gap-2">
      <button
        onClick={onUpload}
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
            Importar
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
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors w-72"
            autoFocus
          />
          <button
            onClick={handleImport}
            disabled={importing || !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 border border-zinc-700 shrink-0"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
            Importar
          </button>
          <button
            onClick={() => { setShowLinkedin(false); setLinkedinUrl(''); }}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors px-2 py-2"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLinkedin(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 border border-zinc-700"
        >
          <Link className="w-4 h-4" />
          LinkedIn
        </button>
      )}
    </div>
  );
}
