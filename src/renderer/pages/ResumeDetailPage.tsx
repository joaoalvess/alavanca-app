import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  Loader2,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Linkedin,
  FileText,
  MapPin,
  Mail,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { useAppStore } from '../stores/app-store';
import { TargetRoleCombobox } from '../components/resumes/TargetRoleCombobox';
import { ScorePanel } from '../components/resumes/ScorePanel';
import type { ResumeRecord, StructuredResume, AtsScore, LinkedInScore } from '../types';

function getDisplayName(filename: string): string {
  if (filename.startsWith('https://www.linkedin.com/in/')) {
    const match = filename.match(/linkedin\.com\/in\/([^/]+)/);
    if (match) return 'Perfil LinkedIn';
  }
  return filename;
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

function getCurrentRole(structured: StructuredResume): string | null {
  const exp = structured.experience[0];
  if (!exp) return null;
  return `${exp.title}${exp.company ? ` @ ${exp.company}` : ''}`;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useElectronAPI();
  const { setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId } =
    useAppStore();

  const [record, setRecord] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Scoring state — independent per type
  const [targetRole, setTargetRole] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [linkedInScore, setLinkedInScore] = useState<LinkedInScore | null>(null);
  const [isScoringAts, setIsScoringAts] = useState(false);
  const [isScoringLinkedIn, setIsScoringLinkedIn] = useState(false);

  const resumeId = Number(id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [r, titles] = await Promise.all([
          api.getResume(resumeId),
          api.getDistinctJobTitles(),
        ]);
        setRecord(r);
        setJobTitles(titles);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    })();
  }, [api, resumeId]);

  // Load cached scores when targetRole changes
  useEffect(() => {
    if (!targetRole.trim()) {
      setAtsScore(null);
      setLinkedInScore(null);
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
          setAtsScore(ats.find((s) => s.resumeId === resumeId) ?? null);
          setLinkedInScore(linkedin.find((s) => s.resumeId === resumeId) ?? null);
        }
      } catch {
        // silently handle
      }
    })();
    return () => { cancelled = true; };
  }, [targetRole, api, resumeId]);

  const handleComputeAts = useCallback(async () => {
    const role = targetRole.trim();
    if (!role) return;
    setIsScoringAts(true);
    try {
      const score = await api.computeAtsScore(resumeId, role);
      setAtsScore(score);
      const titles = await api.getDistinctJobTitles();
      setJobTitles(titles);
    } catch {
      // silently handle
    } finally {
      setIsScoringAts(false);
    }
  }, [api, resumeId, targetRole]);

  const handleComputeLinkedIn = useCallback(async () => {
    const role = targetRole.trim();
    if (!role) return;
    setIsScoringLinkedIn(true);
    try {
      const score = await api.computeLinkedInScore(resumeId, role);
      setLinkedInScore(score);
      const titles = await api.getDistinctJobTitles();
      setJobTitles(titles);
    } catch {
      // silently handle
    } finally {
      setIsScoringLinkedIn(false);
    }
  }, [api, resumeId, targetRole]);

  const handleOptimize = useCallback(() => {
    if (!record) return;
    const structured = JSON.parse(record.structured) as StructuredResume;
    setResumeText(record.rawText);
    setResumeFilename(record.filename);
    setCurrentResume(structured);
    setSelectedResumeId(record.id);
    navigate('/optimize');
  }, [record, navigate, setResumeText, setResumeFilename, setCurrentResume, setSelectedResumeId]);

  const handleDelete = useCallback(async () => {
    if (!record) return;
    if (!confirm('Tem certeza que deseja deletar este curriculo?')) return;
    try {
      await api.deleteResume(record.id);
      navigate('/resumes');
    } catch {
      // silently handle
    }
  }, [api, record, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-zinc-400">Curriculo nao encontrado.</p>
        <button onClick={() => navigate('/resumes')} className="text-emerald-400 hover:underline mt-2 text-sm">
          Voltar para curriculos
        </button>
      </div>
    );
  }

  let structured: StructuredResume | null = null;
  try {
    structured = JSON.parse(record.structured) as StructuredResume;
  } catch {
    // invalid
  }

  const isLinkedin = record.filename.startsWith('https://www.linkedin.com/in/');
  const displayName = structured?.contactInfo.name || getDisplayName(record.filename);
  const currentRole = structured ? getCurrentRole(structured) : null;
  const hasTargetRole = targetRole.trim().length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {/* Top bar: back + actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/resumes')}
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Curriculos
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimize}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Otimizar
            </button>
            <button
              onClick={handleDelete}
              className="text-zinc-500 hover:text-red-400 transition-colors rounded-lg p-2 hover:bg-red-500/10"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile identity */}
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-emerald-400">
              {getInitials(displayName)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-100">{displayName}</h1>
            {currentRole && (
              <p className="text-sm text-zinc-400 mt-0.5">{currentRole}</p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {structured?.contactInfo.location && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  {structured.contactInfo.location}
                </span>
              )}
              {structured?.contactInfo.email && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Mail className="w-3 h-3" />
                  {structured.contactInfo.email}
                </span>
              )}
              {/* Source badge */}
              {isLinkedin ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                  <FileText className="w-3 h-3" />
                  PDF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target role — highlighted */}
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Objetivo de Carreira</span>
          </div>
          <TargetRoleCombobox
            value={targetRole}
            onChange={setTargetRole}
            jobTitles={jobTitles}
          />
          {!hasTargetRole && (
            <p className="text-xs text-zinc-500 mt-2">Defina o cargo que deseja alcancar para avaliar seu perfil.</p>
          )}
        </div>
      </div>

      {/* Score Dashboard */}
      <ScorePanel
        atsScore={atsScore}
        linkedInScore={linkedInScore}
        isScoringAts={isScoringAts}
        isScoringLinkedIn={isScoringLinkedIn}
        hasTargetRole={hasTargetRole}
        onComputeAts={handleComputeAts}
        onComputeLinkedIn={handleComputeLinkedIn}
      />

      {/* Resume Content — collapsible sections */}
      {structured ? (
        <div className="space-y-4">
          {structured.summary && (
            <CollapsibleSection
              title="Resumo Profissional"
              icon={<FileText className="w-4 h-4" />}
            >
              <p className="text-sm text-zinc-300 leading-relaxed">{structured.summary}</p>
            </CollapsibleSection>
          )}

          {structured.experience.length > 0 && (
            <CollapsibleSection
              title="Experiencia"
              icon={<Briefcase className="w-4 h-4" />}
            >
              <div className="space-y-5 relative">
                {/* Timeline line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-800" />
                {structured.experience.map((exp, i) => (
                  <div key={i} className="pl-6 relative">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-zinc-800 border-2 border-emerald-500" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-100">{exp.title}</h3>
                        <p className="text-sm text-zinc-400">{exp.company}{exp.location ? ` — ${exp.location}` : ''}</p>
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0 ml-4">
                        {exp.startDate} — {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-zinc-400 mt-2">{exp.description}</p>
                    )}
                    {exp.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-sm text-zinc-300 flex items-start gap-2">
                            <span className="text-emerald-500 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-emerald-500" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {structured.education.length > 0 && (
            <CollapsibleSection
              title="Educacao"
              icon={<GraduationCap className="w-4 h-4" />}
            >
              <div className="space-y-4">
                {structured.education.map((edu, i) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-zinc-800' : ''}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">{edu.degree}</h3>
                        <p className="text-sm text-zinc-400">{edu.institution}{edu.location ? ` — ${edu.location}` : ''}</p>
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0 ml-4">
                        {edu.startDate} — {edu.endDate}
                      </span>
                    </div>
                    {edu.gpa && <p className="text-xs text-zinc-500 mt-1">GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {structured.skills.length > 0 && (
            <CollapsibleSection
              title="Skills"
              icon={<Award className="w-4 h-4" />}
            >
              <div className="flex flex-wrap gap-2">
                {structured.skills.map((skill) => (
                  <span key={skill} className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {(structured.certifications.length > 0 || structured.languages.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {structured.certifications.length > 0 && (
                <CollapsibleSection
                  title="Certificacoes"
                  icon={<Award className="w-4 h-4" />}
                >
                  <ul className="space-y-1.5">
                    {structured.certifications.map((cert, i) => (
                      <li key={i} className="text-sm text-zinc-300">{cert}</li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
              {structured.languages.length > 0 && (
                <CollapsibleSection
                  title="Idiomas"
                  icon={<Globe className="w-4 h-4" />}
                >
                  <ul className="space-y-1.5">
                    {structured.languages.map((lang, i) => (
                      <li key={i} className="text-sm text-zinc-300">{lang}</li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-400">Nao foi possivel renderizar o conteudo estruturado.</p>
        </div>
      )}
    </div>
  );
}
