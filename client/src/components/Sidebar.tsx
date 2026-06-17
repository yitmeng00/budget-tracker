import { ArrowLeftRight, ChevronDown, PieChart, Settings, Wallet } from 'lucide-react';
import type { Tab, UserSettings } from '../types/index.ts';
import { formatMoney } from '../lib/currency.ts';

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={20} /> },
  { key: 'stats', label: 'Statistics', icon: <PieChart size={20} /> },
  { key: 'accounts', label: 'Accounts', icon: <Wallet size={20} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  settings: UserSettings;
  budgetSpent: number;
  budgetTotal: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  settings,
  budgetSpent,
  budgetTotal,
}: Props) {
  const sym = settings.currency_symbol;
  const pos = settings.unit_position;
  const pct = Math.min(Math.round((budgetSpent / budgetTotal) * 100), 100);
  const monthName = new Date(2026, 5, 1).toLocaleDateString('en-US', { month: 'long' });

  return (
    <aside className="w-66 shrink-0 bg-surface border-r border-border flex flex-col px-4.5 py-5.5">
      {/* Logo */}
      <div className="flex items-center gap-2.75 px-2 pb-6.5 pt-1.5">
        <img
          src="/budget-tracker-logo.png"
          alt="Ledgr logo"
          className="w-9.5 h-9.5 object-contain"
        />
        <span className="text-[22px] font-extrabold tracking-[-0.03em]">Ledgr</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={[
                'flex items-center gap-3 px-3.25 py-2.75 rounded-[13px]',
                'text-[14.5px] w-full text-left border-0 cursor-pointer transition-colors duration-150',
                active
                  ? 'bg-accent-soft text-accent font-bold'
                  : 'bg-transparent text-[#6b6780] font-semibold hover:bg-accent-soft/50',
              ].join(' ')}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Budget progress card */}
      <div className="mt-6 p-4.5 rounded-[18px] text-white bg-[linear-gradient(150deg,#2563eb,#0ea5e9)]">
        <div className="text-sm font-bold mb-0.75">{monthName} budget</div>
        <div className="text-[12.5px] opacity-85 mb-3">
          {formatMoney(budgetSpent, sym, pos)} of {formatMoney(budgetTotal, sym, pos)}
        </div>
        <div className="h-2 rounded-md bg-white/28 overflow-hidden">
          <div className="h-full rounded-md bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* User footer */}
      <div className="mt-auto flex items-center gap-2.75 p-2.75 rounded-2xl bg-accent-soft">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#ef4444)] flex items-center justify-center text-white font-extrabold text-[15px]">
          TU
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">Test User</div>
          <div className="text-xs text-text-subtle">
            {settings.currency_code} · {sym}
          </div>
        </div>
        <ChevronDown size={18} className="text-text-faint" />
      </div>
    </aside>
  );
}
