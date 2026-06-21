import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import type { UserSettings } from '../types/index.ts';
import type { MonthlyBarData } from '../lib/mockData.ts';
import { fetchMonthlyStats, fetchCategoryStats } from '../lib/api.ts';
import { formatMoney } from '../lib/currency.ts';
import IncomeExpenseChart from '../components/stats/IncomeExpenseChart.tsx';
import TopCategories from '../components/stats/TopCategories.tsx';

interface Props {
  year: number;
  month: number; // 0-indexed
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

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function StatsPage({ year, month, settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;

  const { data: monthlySummaries = [] } = useQuery({
    queryKey: ['stats/monthly'],
    queryFn: fetchMonthlyStats,
  });

  const { data: categoryBreakdown = [] } = useQuery({
    queryKey: ['stats/categories', year, month],
    queryFn: () => fetchCategoryStats(year, month),
  });

  const bars: MonthlyBarData[] = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    let m = month + 1 - offset; // month is 0-indexed; m is 1-indexed
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const found = monthlySummaries.find((r) => r.year === y && r.month === m);
    return {
      month: MONTH_SHORT[m - 1],
      income: Number(found?.income ?? 0),
      expense: Number(found?.expenses ?? 0),
    };
  });

  const cur = monthlySummaries.find((r) => r.year === year && r.month === month + 1);
  const totalIncome = Number(cur?.income ?? 0);
  const totalExpenses = Number(cur?.expenses ?? 0);
  const net = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  const topCats = categoryBreakdown.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    amount: Number(c.total),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={formatMoney(totalIncome, sym, pos)}
          color="#16a34a"
        />
        <StatCard
          icon={CreditCard}
          label="Total Expenses"
          value={formatMoney(totalExpenses, sym, pos)}
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

      <IncomeExpenseChart bars={bars} />
      <TopCategories categories={topCats} settings={settings} />
    </div>
  );
}
