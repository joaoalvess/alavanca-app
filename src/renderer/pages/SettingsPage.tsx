import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Terminal,
  Download,
  LogIn,
} from 'lucide-react';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { cn } from '../lib/utils';

type StepStatus = 'pending' | 'active' | 'completed';

interface StepInfo {
  number: number;
  label: string;
  status: StepStatus;
}

export function SettingsPage() {
  const api = useElectronAPI();

  const [checking, setChecking] = useState(true);
  const [codexInstalled, setCodexInstalled] = useState(false);
  const [codexAuthenticated, setCodexAuthenticated] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installLog, setInstallLog] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive active step from state
  const activeStep = !codexInstalled ? 1 : !codexAuthenticated ? 2 : 3;

  const steps: StepInfo[] = [
    {
      number: 1,
      label: 'Instalar',
      status: codexInstalled ? 'completed' : activeStep === 1 ? 'active' : 'pending',
    },
    {
      number: 2,
      label: 'Autenticar',
      status: codexAuthenticated ? 'completed' : activeStep === 2 ? 'active' : 'pending',
    },
    {
      number: 3,
      label: 'Pronto',
      status: codexInstalled && codexAuthenticated ? 'completed' : 'pending',
    },
  ];

  // Check status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setChecking(true);
      try {
        const { installed } = await api.checkCodexInstalled();
        setCodexInstalled(installed);
        if (installed) {
          try {
            const { authenticated } = await api.checkCodexAuth();
            setCodexAuthenticated(authenticated);
          } catch {
            setCodexAuthenticated(false);
          }
        }
      } catch {
        setCodexInstalled(false);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [api]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    setInstallLog('');
    setError(null);

    const cleanup = api.onInstallProgress((data: string) => {
      setInstallLog((prev) => prev + data);
    });

    try {
      const result = await api.installCodex();
      cleanup();
      if (result.success) {
        setCodexInstalled(true);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      cleanup();
      setError(err?.message || 'Erro ao instalar Codex CLI.');
    } finally {
      setInstalling(false);
    }
  }, [api]);

  const handleLogin = useCallback(async () => {
    setLoggingIn(true);
    setError(null);
    try {
      const result = await api.loginCodex();
      if (result.success) {
        const { authenticated } = await api.checkCodexAuth();
        setCodexAuthenticated(authenticated);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login.');
    } finally {
      setLoggingIn(false);
    }
  }, [api]);

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testApiConnection();
      setTestResult(result);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  }, [api]);

  const renderStepContent = () => {
    if (checking) {
      return (
        <div className="flex items-center justify-center gap-3 py-12 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Verificando status do Codex CLI...
        </div>
      );
    }

    // Step 1: Install
    if (activeStep === 1) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-zinc-400" />
            <div>
              <h3 className="text-base font-medium text-zinc-100">Instalar Codex CLI</h3>
              <p className="text-sm text-zinc-400">
                O Codex CLI e necessario para otimizar seus resumos com IA. Sera instalado via npm.
              </p>
            </div>
          </div>

          {!installing && (
            <button
              onClick={handleInstall}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar Codex CLI
            </button>
          )}

          {installing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Instalando...
              </div>
              {installLog && (
                <pre className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {installLog}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    // Step 2: Authenticate
    if (activeStep === 2) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-zinc-400" />
            <div>
              <h3 className="text-base font-medium text-zinc-100">Autenticar no OpenAI</h3>
              <p className="text-sm text-zinc-400">
                Faca login com sua conta OpenAI. O navegador sera aberto automaticamente para autenticacao OAuth.
              </p>
            </div>
          </div>

          {!loggingIn && (
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Fazer Login
            </button>
          )}

          {loggingIn && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Abrindo navegador para autenticacao...
            </div>
          )}
        </div>
      );
    }

    // Step 3: Ready
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-base font-medium text-zinc-100">Tudo configurado!</h3>
            <p className="text-sm text-zinc-400">
              O Codex CLI esta instalado e autenticado. Voce ja pode otimizar seus resumos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Testar Conexao
          </button>
          {testResult === true && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Conexao OK
            </span>
          )}
          {testResult === false && (
            <span className="flex items-center gap-1 text-sm text-red-400">
              <XCircle className="w-4 h-4" />
              Falha na conexao
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-emerald-400" />
          Configuracao do Codex CLI
        </h1>
        <p className="mt-2 text-zinc-400">
          Configure a IA para otimizar seus resumos.
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    step.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'active'
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-500'
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'completed'
                      ? 'text-emerald-400'
                      : step.status === 'active'
                        ? 'text-zinc-100'
                        : 'text-zinc-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-4',
                    steps[i + 1].status === 'completed' || steps[i + 1].status === 'active'
                      ? 'bg-emerald-600/50'
                      : 'bg-zinc-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800" />

        {/* Step content */}
        <div className="min-h-[120px]">
          {renderStepContent()}
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-red-300 text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
