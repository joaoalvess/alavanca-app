import { MapPin, Mail, FileText, Linkedin, Target } from 'lucide-react';
import { TargetRoleCombobox } from './TargetRoleCombobox';
import type { ResumeRecord } from '../../types';

interface ProfileHeaderProps {
  displayName: string;
  currentRole: string | null;
  email: string | null;
  location: string | null;
  primaryResume: ResumeRecord | null;
  primaryLinkedIn: ResumeRecord | null;
  targetRole: string;
  onTargetRoleChange: (value: string) => void;
  jobTitles: string[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfileHeader({
  displayName,
  currentRole,
  email,
  location,
  primaryResume,
  primaryLinkedIn,
  targetRole,
  onTargetRoleChange,
  jobTitles,
}: ProfileHeaderProps) {
  const hasTargetRole = targetRole.trim().length > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {/* Profile identity */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-emerald-400">
            {getInitials(displayName)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-zinc-100">{displayName}</h1>
          {currentRole && (
            <p className="text-sm text-zinc-400 mt-0.5">{currentRole}</p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {location && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Mail className="w-3 h-3" />
                {email}
              </span>
            )}
            {/* Source badges */}
            {primaryResume && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <FileText className="w-3 h-3" />
                Curriculo
              </span>
            )}
            {primaryLinkedIn && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(primaryLinkedIn.filename, '_blank');
                }}
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors cursor-pointer"
              >
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Target role strip */}
      <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Objetivo de Carreira</span>
        </div>
        <TargetRoleCombobox
          value={targetRole}
          onChange={onTargetRoleChange}
          jobTitles={jobTitles}
          hideLabel
        />
        {!hasTargetRole && (
          <p className="text-xs text-zinc-500 mt-2">Defina o cargo que deseja alcancar para avaliar seu perfil.</p>
        )}
      </div>
    </div>
  );
}
