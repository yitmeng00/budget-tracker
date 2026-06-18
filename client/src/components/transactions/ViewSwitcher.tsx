import { Search } from 'lucide-react';
import type { TxView } from '../../types/index.ts';

const VIEWS: { key: TxView; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'monthly', label: 'Monthly' },
];

interface Props {
  active: TxView;
  onChange: (v: TxView) => void;
}

export default function ViewSwitcher({ active, onChange }: Props) {
  return (
    <div className="flex items-center justify-between mb-4.5">
      <div className="inline-flex gap-1 bg-border rounded-[15px] p-1.25">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              'px-4.5 py-2.25 rounded-[11px] text-[13.5px] font-semibold border-0 cursor-pointer transition-all duration-150',
              active === key
                ? 'bg-surface text-text-primary font-bold shadow-[0_2px_8px_rgba(37,99,235,0.12)]'
                : 'bg-transparent text-text-muted hover:text-text-primary',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.25 bg-surface border border-border rounded-[13px] px-3.5 py-2.25 text-text-subtle text-[13.5px] font-medium">
        <Search size={16} />
        Search transactions
      </div>
    </div>
  );
}
