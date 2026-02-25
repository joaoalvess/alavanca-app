import type { ElectronAPI } from '../types';

export function useElectronAPI(): ElectronAPI {
  return window.electronAPI;
}
