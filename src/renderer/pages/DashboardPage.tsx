import { Link } from 'react-router-dom';
import {
  Sparkles,
  History,
  Settings,
  FileText,
  BrainCircuit,
  Target,
  Linkedin,
  Download,
  ArrowRight,
} from 'lucide-react';

const quickActions = [
  {
    to: '/optimize',
    icon: Sparkles,
    title: 'Otimizar Curriculo',
    description: 'Analise e otimize seu curriculo para uma vaga especifica',
  },
  {
    to: '/history',
    icon: History,
    title: 'Ver Historico',
    description: 'Acesse otimizacoes anteriores e seus resultados',
  },
  {
    to: '/settings',
    icon: Settings,
    title: 'Configuracoes',
    description: 'Configure as chaves de API e preferencias',
  },
];

const pipelineSteps = [
  {
    icon: FileText,
    step: '1',
    title: 'Estruturacao',
    description:
      'A IA analisa seu curriculo e extrai todas as informacoes em um formato estruturado: dados pessoais, experiencias, formacao, habilidades e mais.',
  },
  {
    icon: BrainCircuit,
    step: '2',
    title: 'Analise da Vaga',
    description:
      'A descricao da vaga e processada para identificar requisitos, habilidades necessarias, palavras-chave e qualificacoes esperadas.',
  },
  {
    icon: Target,
    step: '3',
    title: 'Otimizacao',
    description:
      'Seu curriculo e otimizado com base nos requisitos da vaga, maximizando a compatibilidade e destacando as experiencias mais relevantes.',
  },
];

export function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">
          Bem-vindo ao Alavanca
        </h1>
        <p className="mt-2 text-zinc-400 text-lg">
          Otimize seu curriculo com inteligencia artificial para cada vaga que
          voce deseja. Aumente suas chances de ser chamado para entrevistas.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-emerald-600/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400 group-hover:bg-emerald-600/20 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-zinc-100">{title}</h3>
            </div>
            <p className="text-sm text-zinc-400">{description}</p>
            <div className="mt-4 flex items-center gap-1 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Acessar <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Como funciona o pipeline de IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipelineSteps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative"
            >
              <span className="absolute top-4 right-4 text-4xl font-bold text-zinc-800">
                {step}
              </span>
              <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400 w-fit mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
              <p className="text-sm text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LinkedIn Import Guide */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
            <Linkedin className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">
            Importar do LinkedIn
          </h2>
        </div>
        <p className="text-zinc-400 mb-6">
          Voce pode exportar seu perfil do LinkedIn como PDF e usa-lo como base
          para a otimizacao. Siga os passos abaixo:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 text-sm font-semibold shrink-0">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Acesse seu perfil
              </p>
              <p className="text-sm text-zinc-500">
                Va ate seu perfil no LinkedIn e clique no botao "Mais" (More).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 text-sm font-semibold shrink-0">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Salvar como PDF
              </p>
              <p className="text-sm text-zinc-500">
                Selecione "Salvar como PDF" (Save to PDF) no menu que aparecer.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 text-sm font-semibold shrink-0">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Importar no app
              </p>
              <p className="text-sm text-zinc-500">
                Use o PDF baixado na pagina de otimizacao para comecar.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link
            to="/optimize"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Comecar otimizacao
          </Link>
        </div>
      </div>
    </div>
  );
}
