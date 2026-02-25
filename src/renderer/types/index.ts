export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface StructuredResume {
  contactInfo: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  languages: string[];
  rawText: string;
}

export interface JobRequirements {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  experienceLevel: string;
  responsibilities: string[];
  qualifications: string[];
}

export interface KeywordAnalysis {
  keyword: string;
  found: boolean;
  section?: string;
}

export interface SectionScore {
  section: string;
  score: number;
  suggestions: string[];
}

export interface OptimizationResult {
  overallScore: number;
  sectionScores: SectionScore[];
  keywordAnalysis: KeywordAnalysis[];
  optimizedResume: StructuredResume;
  changesSummary: string[];
}

export interface ResumeRecord {
  id: number;
  filename: string;
  rawText: string;
  structured: string; // JSON string of StructuredResume
  createdAt: string;
}

export interface JobRecord {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string; // JSON string of JobRequirements
  createdAt: string;
}

export interface OptimizationRecord {
  id: number;
  resumeId: number;
  jobId: number;
  result: string; // JSON string of OptimizationResult
  createdAt: string;
  resumeFilename?: string;
  jobTitle?: string;
  jobCompany?: string;
  overallScore?: number;
}

export interface AppSettings {
  activeProvider: 'codex';
}

export type CodexSetupStep = 'checking' | 'not-installed' | 'installing' | 'installed' | 'logging-in' | 'ready' | 'error';

export type StreamChunk = {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
};

export interface ElectronAPI {
  // Resume
  parseResume: (filePath: string) => Promise<{ text: string; filename: string }>;
  selectResumeFile: () => Promise<string | null>;

  // AI
  structureResume: (text: string) => Promise<StructuredResume>;
  extractJobRequirements: (description: string) => Promise<JobRequirements>;
  optimizeResume: (
    resume: StructuredResume,
    job: JobRequirements
  ) => Promise<OptimizationResult>;
  testApiConnection: () => Promise<boolean>;
  checkCodexInstalled: () => Promise<{ installed: boolean }>;
  onStreamChunk: (callback: (chunk: StreamChunk) => void) => () => void;
  installCodex: () => Promise<{ success: boolean; message: string }>;
  loginCodex: () => Promise<{ success: boolean; message: string }>;
  checkCodexAuth: () => Promise<{ authenticated: boolean }>;
  onInstallProgress: (callback: (data: string) => void) => () => void;

  // Settings
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;

  // History
  saveResume: (filename: string, rawText: string, structured: StructuredResume) => Promise<number>;
  saveJob: (title: string, company: string, description: string, requirements: JobRequirements) => Promise<number>;
  saveOptimization: (resumeId: number, jobId: number, result: OptimizationResult) => Promise<number>;
  getOptimizations: () => Promise<OptimizationRecord[]>;
  getOptimization: (id: number) => Promise<OptimizationRecord | null>;
  deleteOptimization: (id: number) => Promise<void>;

  // Export
  exportPdf: (resume: StructuredResume) => Promise<string>;
  exportDocx: (resume: StructuredResume) => Promise<string>;

  // Scraping
  scrapeJobUrl: (url: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
