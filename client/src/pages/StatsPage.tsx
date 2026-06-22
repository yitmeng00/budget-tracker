import { useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CreditCard, PiggyBank, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthlyBarData, UserSettings } from '../types/index.ts';
import { fetchMonthlyStats, fetchCategoryStats } from '../lib/api.ts';
import { formatMoney } from '../lib/currency.ts';
import { MONTH_SHORT } from '../lib/constants.ts';
import IncomeExpenseChart from '../components/stats/IncomeExpenseChart.tsx';
import TopCategories from '../components/stats/TopCategories.tsx';

interface Props {
  year: number;
  month: number; // 0-indexed
  settings: UserSettings;
}

type StatsView = 'monthly' | 'annual';

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

export default function StatsPage({ year, month, settings }: Props) {
  const [view, setView] = useState<StatsView>('monthly');
  const [annualYear, setAnnualYear] = useState(year);
  const { currency_symbol: sym, unit_position: pos } = settings;

  const { data: monthlySummaries = [] } = useQuery({
    queryKey: ['stats/monthly'],
    queryFn: fetchMonthlyStats,
  });

  const { data: monthCategoryBreakdown = [] } = useQuery({
    queryKey: ['stats/categories', year, month],
    queryFn: () => fetchCategoryStats(year, month),
    enabled: view === 'monthly',
  });

  const { data: annualCategoryBreakdown = [] } = useQuery({
    queryKey: ['stats/categories', annualYear],
    queryFn: () => fetchCategoryStats(annualYear),
    enabled: view === 'annual',
  });

  // Monthly view data
  const monthlyBars: MonthlyBarData[] = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    let m = month + 1 - offset;
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
  const monthlyIncome = Number(cur?.income ?? 0);
  const monthlyExpenses = Number(cur?.expenses ?? 0);
  const monthlyNet = monthlyIncome - monthlyExpenses;
  const monthlySavingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0;

  // Annual view data
  const yearSummaries = monthlySummaries.filter((r) => r.year === annualYear);
  const annualIncome = yearSummaries.reduce((s, r) => s + Number(r.income), 0);
  const annualExpenses = yearSummaries.reduce((s, r) => s + Number(r.expenses), 0);
  const annualNet = annualIncome - annualExpenses;
  const annualSavingsRate = annualIncome > 0 ? (annualNet / annualIncome) * 100 : 0;

  const annualBars: MonthlyBarData[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const found = monthlySummaries.find((r) => r.year === annualYear && r.month === m);
    return {
      month: MONTH_SHORT[i],
      income: Number(found?.income ?? 0),
      expense: Number(found?.expenses ?? 0),
    };
  });

  const minYear =
    monthlySummaries.length > 0 ? Math.min(...monthlySummaries.map((r) => r.year)) : annualYear;

  const totalIncome = view === 'annual' ? annualIncome : monthlyIncome;
  const totalExpenses = view === 'annual' ? annualExpenses : monthlyExpenses;
  const net = view === 'annual' ? annualNet : monthlyNet;
  const savingsRate = view === 'annual' ? annualSavingsRate : monthlySavingsRate;

  const bars = view === 'annual' ? annualBars : monthlyBars;

  const rawCategories = view === 'annual' ? annualCategoryBreakdown : monthCategoryBreakdown;
  const topCats = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    amount: Number(c.total),
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* View toggle + year navigation */}
      <div className="flex items-center gap-3">
        <div className="inline-flex gap-1 bg-border rounded-[15px] p-1.25">
          {(['monthly', 'annual'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                'px-4.5 py-2.25 rounded-[11px] text-[13.5px] font-semibold border-0 cursor-pointer transition-all duration-150',
                view === v
                  ? 'bg-surface text-text-primary font-bold shadow-[0_2px_8px_rgba(37,99,235,0.12)]'
                  : 'bg-transparent text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {v === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>

        {view === 'annual' && (
          <div className="flex items-center gap-1 bg-surface border border-border rounded-[13px] px-2 py-1.5">
            <button
              onClick={() => setAnnualYear((y) => y - 1)}
              disabled={annualYear <= minYear}
              className="p-1 rounded-[7px] text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13.5px] font-bold text-text-primary tabular-nums w-10 text-center">
              {annualYear}
            </span>
            <button
              onClick={() => setAnnualYear((y) => y + 1)}
              disabled={annualYear >= year}
              className="p-1 rounded-[7px] text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
