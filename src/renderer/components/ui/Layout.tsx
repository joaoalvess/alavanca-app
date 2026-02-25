import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Sparkles,
  History,
  Settings,
  FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/resumes', label: 'Curriculos', icon: FileText },
  { to: '/optimize', label: 'Otimizar', icon: Sparkles },
  { to: '/history', label: 'Historico', icon: History },
  { to: '/settings', label: 'Configuracoes', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-200 ease-in-out shrink-0',
          expanded ? 'w-60' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0">
            AL
          </div>
          <span
            className={cn(
              'text-sm font-semibold text-zinc-100 whitespace-nowrap transition-opacity duration-200',
              expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            )}
          >
            Alavanca
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap transition-opacity duration-200',
                  expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                )}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <FileText className="w-5 h-5 text-zinc-500 shrink-0" />
            <span
              className={cn(
                'text-xs text-zinc-500 whitespace-nowrap transition-opacity duration-200',
                expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              )}
            >
              v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 p-8">
        {children}
      </main>
    </div>
  );
}
