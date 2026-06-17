import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Tab } from '../types/index.ts';

const PAGE_META: Record<Tab, { title: string; subtitle: string }> = {
  transactions: { title: 'Transactions', subtitle: 'Track your daily money flow' },
  stats: { title: 'Statistics', subtitle: 'Understand your spending patterns' },
  accounts: { title: 'Accounts', subtitle: 'All your balances in one place' },
  settings: { title: 'Settings', subtitle: 'Manage your preferences' },
};

interface Props {
  tab: Tab;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddTransaction: () => void;
}

export default function Header({
  tab,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onAddTransaction,
}: Props) {
  const { title, subtitle } = PAGE_META[tab];
  const showMonthNav = tab === 'transactions' || tab === 'stats';
  const showAdd = tab === 'transactions';

  return (
    <header className="flex items-center justify-between gap-4 px-8.5 pt-6.5 pb-4">
      <div>
        <div className="text-[25px] font-extrabold tracking-[-0.02em]">{title}</div>
        <div className="text-sm text-text-muted mt-0.75">{subtitle}</div>
      </div>

      <div className="flex items-center gap-3">
        {showMonthNav && (
          <div className="flex items-center gap-0.5 bg-surface border border-border rounded-[14px] p-1.25">
            <button
              onClick={onPrevMonth}
              className="w-8 h-8 border-0 bg-transparent rounded-[10px] text-text-muted cursor-pointer flex items-center justify-center hover:bg-bg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-sm px-2">{monthLabel}</span>
            <button
              onClick={onNextMonth}
              className="w-8 h-8 border-0 bg-transparent rounded-[10px] text-text-muted cursor-pointer flex items-center justify-center hover:bg-bg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {showAdd && (
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-2 bg-accent text-white border-0 rounded-[14px] px-4.5 py-2.75 font-bold text-sm cursor-pointer shadow-[0_8px_20px_color-mix(in_srgb,#2563eb_34%,transparent)] hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Add transaction
          </button>
        )}
      </div>
    </header>
  );
}
