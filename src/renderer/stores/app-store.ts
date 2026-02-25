import { create } from 'zustand';
import type {
  StructuredResume,
  JobRequirements,
  OptimizationResult,
  AppSettings,
} from '../types';

interface AppState {
  currentResume: StructuredResume | null;
  currentJob: JobRequirements | null;
  currentOptimization: OptimizationResult | null;
  resumeText: string;
  resumeFilename: string;
  jobDescription: string;
  isOptimizing: boolean;
  streamContent: string;
  settings: AppSettings;
  selectedResumeId: number | null;

  setCurrentResume: (resume: StructuredResume | null) => void;
  setCurrentJob: (job: JobRequirements | null) => void;
  setCurrentOptimization: (optimization: OptimizationResult | null) => void;
  setResumeText: (text: string) => void;
  setResumeFilename: (filename: string) => void;
  setJobDescription: (description: string) => void;
  setIsOptimizing: (optimizing: boolean) => void;
  setSelectedResumeId: (id: number | null) => void;
  appendStreamContent: (content: string) => void;
  clearStreamContent: () => void;
  setSettings: (settings: AppSettings) => void;
  reset: () => void;
}

const defaultSettings: AppSettings = {
  activeProvider: 'codex',
};

const initialState = {
  currentResume: null,
  currentJob: null,
  currentOptimization: null,
  resumeText: '',
  resumeFilename: '',
  jobDescription: '',
  isOptimizing: false,
  streamContent: '',
  settings: defaultSettings,
  selectedResumeId: null,
};

export const useAppStore = create<AppState>()((set) => ({
  ...initialState,

  setCurrentResume: (resume) => set({ currentResume: resume }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setCurrentOptimization: (optimization) =>
    set({ currentOptimization: optimization }),
  setResumeText: (text) => set({ resumeText: text }),
  setResumeFilename: (filename) => set({ resumeFilename: filename }),
  setJobDescription: (description) => set({ jobDescription: description }),
  setIsOptimizing: (optimizing) => set({ isOptimizing: optimizing }),
  setSelectedResumeId: (id) => set({ selectedResumeId: id }),
  appendStreamContent: (content) =>
    set((state) => ({ streamContent: state.streamContent + content })),
  clearStreamContent: () => set({ streamContent: '' }),
  setSettings: (settings) => set({ settings }),
  reset: () => set(initialState),
}));
