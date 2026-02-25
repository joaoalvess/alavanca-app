import { Loader2, Lightbulb, Target, Star, Link, Eye } from 'lucide-react';
import type { AtsScore, LinkedInScore } from '../../types';

interface ScorePanelProps {
  atsScore: AtsScore | null;
  linkedInScore: LinkedInScore | null;
  isScoringAts: boolean;
  isScoringLinkedIn: boolean;
  hasTargetRole: boolean;
  onComputeAts: () => void;
  onComputeLinkedIn: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/25';
  if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function ScoreCard({
  label,
  icon,
  score,
  isScoring,
  onCompute,
  hasTargetRole,
}: {
  label: string;
  icon: React.ReactNode;
  score: number | null;
  isScoring: boolean;
  onCompute?: () => void;
  hasTargetRole: boolean;
}) {
  if (isScoring) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col items-center justify-center min-h-[120px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
        <span className="text-xs text-zinc-500">Avaliando...</span>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className={`rounded-xl border p-5 flex flex-col items-center justify-center min-h-[120px] ${getScoreBg(score)}`}>
        <div className="flex items-center gap-1.5 mb-2">
          {icon}
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        </div>
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
    );
  }

  if (!hasTargetRole) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col items-center justify-center min-h-[120px]">
        <div className="flex items-center gap-1.5 mb-2">
          {icon}
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs text-zinc-600 text-center">Defina seu objetivo</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col items-center justify-center min-h-[120px]">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      {onCompute && (
        <button
          onClick={onCompute}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg px-3 py-1.5 transition-colors border border-zinc-700 hover:border-zinc-600"
        >
          Avaliar
        </button>
      )}
    </div>
  );
}

export function ScorePanel({
  atsScore,
  linkedInScore,
  isScoringAts,
  isScoringLinkedIn,
  hasTargetRole,
  onComputeAts,
  onComputeLinkedIn,
}: ScorePanelProps) {
  const atsTips = atsScore?.tips ?? [];
  const linkedInTips = linkedInScore?.tips ?? [];
  const hasTips = atsTips.length > 0 || linkedInTips.length > 0;

  return (
    <div className="space-y-6">
      {/* Score grid 2x2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ScoreCard
          label="ATS"
          icon={<Target className="w-3.5 h-3.5 text-zinc-400" />}
          score={atsScore?.atsScore ?? null}
          isScoring={isScoringAts}
          onCompute={onComputeAts}
          hasTargetRole={hasTargetRole}
        />
        <ScoreCard
          label="Qualidade"
          icon={<Star className="w-3.5 h-3.5 text-zinc-400" />}
          score={atsScore?.qualityScore ?? null}
          isScoring={false}
          hasTargetRole={hasTargetRole}
        />
        <ScoreCard
          label="Visibilidade"
          icon={<Eye className="w-3.5 h-3.5 text-zinc-400" />}
          score={linkedInScore?.visibilityScore ?? null}
          isScoring={isScoringLinkedIn}
          onCompute={onComputeLinkedIn}
          hasTargetRole={hasTargetRole}
        />
        <ScoreCard
          label="Impacto"
          icon={<Link className="w-3.5 h-3.5 text-zinc-400" />}
          score={linkedInScore?.impactScore ?? null}
          isScoring={false}
          hasTargetRole={hasTargetRole}
        />
      </div>

      {/* Tips section */}
      {hasTips && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {atsTips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Dicas ATS</h4>
              <ul className="space-y-2">
                {atsTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {linkedInTips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Dicas LinkedIn</h4>
              <ul className="space-y-2">
                {linkedInTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
