import type { ComponentType } from 'react';
import { TrendingUp, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import type { UserSettings } from '../types/index.ts';
import { MOCK_MONTHLY_BARS } from '../lib/mockData.ts';
import { formatMoney } from '../lib/currency.ts';
import IncomeExpenseChart from '../components/stats/IncomeExpenseChart.tsx';
import TopCategories from '../components/stats/TopCategories.tsx';

interface Props {
  settings: UserSettings;
}

type IconComponent = ComponentType<{ size?: number; color?: string }>;

interface StatCardProps {
  icon: IconComponent;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
      <div
        className="w-9 h-9 rounded-[11px] flex items-center justify-center mb-3"
        style={{ background: `color-mix(in srgb, ${color} 14%, #ffffff)` }}
      >
        <Icon size={17} color={color} />
      </div>
      <div className="text-xs font-semibold text-text-muted mb-1">{label}</div>
      <div className="text-[17px] font-extrabold text-text-primary tabular-nums">{value}</div>
    </div>
  );
}

export default function StatsPage({ settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;

  const cur = MOCK_MONTHLY_BARS[MOCK_MONTHLY_BARS.length - 1];
  const net = cur.income - cur.expense;
  const savingsRate = (net / cur.income) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={formatMoney(cur.income, sym, pos)}
          color="#16a34a"
        />
        <StatCard
          icon={CreditCard}
          label="Total Expenses"
          value={formatMoney(cur.expense, sym, pos)}
          color="#ef4444"
        />
        <StatCard
          icon={PiggyBank}
          label="Net Savings"
          value={formatMoney(net, sym, pos)}
          color="#2563eb"
        />
        <StatCard
          icon={Wallet}
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          color="#2563eb"
        />
      </div>

      <IncomeExpenseChart />
      <TopCategories settings={settings} />
    </div>
  );
}
