import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Target } from 'lucide-react';

interface TargetRoleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  jobTitles: string[];
  hideLabel?: boolean;
}

export function TargetRoleCombobox({ value, onChange, jobTitles, hideLabel }: TargetRoleComboboxProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = jobTitles.filter((t) =>
    t.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      {!hideLabel && (
        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
          <Target className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Cargo alvo
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Ex: Software Engineer, Product Manager..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pr-8"
        />
        {jobTitles.length > 0 && (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((title) => (
            <button
              key={title}
              onClick={() => {
                onChange(title);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
