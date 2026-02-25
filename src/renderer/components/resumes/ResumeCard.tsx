import { FileText, Trash2, Sparkles, Eye, Loader2, Link } from 'lucide-react';
import type { ResumeRecord, StructuredResume } from '../../types';

interface ResumeCardProps {
  record: ResumeRecord;
  onView: (id: number) => void;
  onOptimize: (record: ResumeRecord) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function parseStructured(json: string): StructuredResume | null {
  try {
    return JSON.parse(json) as StructuredResume;
  } catch {
    return null;
  }
}

function isLinkedInProfile(filename: string) {
  return filename.startsWith('https://www.linkedin.com/in/');
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function ResumeCard({ record, onView, onOptimize, onDelete, isDeleting }: ResumeCardProps) {
  const structured = parseStructured(record.structured);
  const isLinkedin = isLinkedInProfile(record.filename);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-5 group hover:border-zinc-700 transition-colors">
      {/* Icon */}
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isLinkedin ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
        {isLinkedin ? <Link className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-zinc-100 truncate">
            {structured?.contactInfo.name || record.filename}
          </h3>
          {isLinkedin && (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">
              LinkedIn
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1">
          {structured && structured.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {structured.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                  {skill}
                </span>
              ))}
              {structured.skills.length > 5 && (
                <span className="text-xs text-zinc-600">+{structured.skills.length - 5}</span>
              )}
            </div>
          )}
        </div>

        <span className="text-xs text-zinc-600 mt-1.5 block">{formatDate(record.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          onClick={() => onView(record.id)}
          className="text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg p-2 hover:bg-zinc-800"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onOptimize(record)}
          className="text-emerald-500/70 hover:text-emerald-400 transition-colors rounded-lg p-2 hover:bg-emerald-500/10"
          title="Otimizar"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(record.id)}
          disabled={isDeleting}
          className="text-zinc-600 hover:text-red-400 transition-colors rounded-lg p-2 hover:bg-red-500/10 disabled:opacity-50"
          title="Deletar"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
