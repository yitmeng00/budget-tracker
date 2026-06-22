import { useQuery } from '@tanstack/react-query';
import type { UserSettings } from '../../types/index.ts';
import type { MonthlyCategoryItem } from '../../lib/mockData.ts';
import { formatMoney } from '../../lib/currency.ts';
import { fetchBudgets } from '../../lib/api.ts';

interface Props {
  year: number;
  month: number; // 0-indexed
  categories: MonthlyCategoryItem[];
  settings: UserSettings;
}

export default function MonthlyView({ year, month, categories, settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;
  const apiMonth = month + 1;

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', year, apiMonth],
    queryFn: () => fetchBudgets(year, apiMonth),
  });

  const expenses = categories.filter((c) => c.amount < 0).sort((a, b) => a.amount - b.amount);
  const incomes = categories.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const totalExpense = expenses.reduce((s, c) => s + Math.abs(c.amount), 0);
  const maxExpense = Math.abs(expenses[0]?.amount ?? 1);
  const maxIncome = incomes[0]?.amount ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Spending breakdown */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="text-sm font-extrabold text-text-primary">Spending</h3>
          <span className="text-sm font-bold text-expense tabular-nums">
            {formatMoney(totalExpense, sym, pos)}
          </span>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No spending this month</p>
        ) : (
          <div className="flex flex-col gap-4">
            {expenses.map((cat) => {
              const entry = budgets.find((b) => b.category_id === cat.id);
              const effectiveAmount = entry
                ? (entry.override_amount ?? entry.default_amount)
                : null;
              const spent = Math.abs(cat.amount);

              let barPct: number;
              let isOver = false;

              if (effectiveAmount !== null) {
                barPct = Math.min((spent / effectiveAmount) * 100, 100);
                isOver = spent > effectiveAmount;
              } else {
                barPct = (spent / maxExpense) * 100;
              }

              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sm font-semibold text-text-primary flex-1 min-w-0 truncate">
                      {cat.name}
                    </span>
                    <div className="text-right shrink-0">
                      <span
                        className={[
                          'text-sm font-bold tabular-nums',
                          isOver ? 'text-expense' : 'text-text-primary',
                        ].join(' ')}
                      >
                        {formatMoney(spent, sym, pos)}
                      </span>
                      {effectiveAmount !== null && (
                        <span className="text-[11px] text-text-muted ml-1.5">
                          / {formatMoney(effectiveAmount, sym, pos)}/mo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${barPct}%`,
                        background: isOver ? '#ef4444' : cat.color,
                      }}
                    />
                  </div>

                  {isOver && effectiveAmount !== null && (
                    <div className="mt-1 text-[11px] font-semibold text-expense">
                      Over by {formatMoney(spent - effectiveAmount, sym, pos)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income breakdown */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <h3 className="text-sm font-extrabold text-text-primary mb-5">Income</h3>

        {incomes.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No income this month</p>
        ) : (
          <div className="flex flex-col gap-4">
            {incomes.map((cat) => {
              const pct = (cat.amount / maxIncome) * 100;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-text-primary flex-1 min-w-0 truncate">
                      {cat.name}
                    </span>
                    <span className="text-sm font-bold text-income tabular-nums shrink-0">
                      {formatMoney(cat.amount, sym, pos)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
