import type { MonthlyBarData } from '../../lib/mockData.ts';

const BAR_MAX_PX = 120;

interface Props {
  bars: MonthlyBarData[];
}

export default function IncomeExpenseChart({ bars }: Props) {
  const maxVal = Math.max(...bars.flatMap((b) => [b.income, b.expense]), 1);

  return (
    <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-extrabold text-text-primary">Income vs Expenses</h3>
        <div className="flex items-center gap-4 text-xs font-semibold text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-income inline-block" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-expense inline-block" />
            Expenses
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {bars.map((bar) => {
          const incH = Math.round((bar.income / maxVal) * BAR_MAX_PX);
          const expH = Math.round((bar.expense / maxVal) * BAR_MAX_PX);
          return (
            <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-end gap-0.5 w-full" style={{ height: `${BAR_MAX_PX}px` }}>
                <div className="flex-1 rounded-t-[3px] bg-income" style={{ height: `${incH}px` }} />
                <div
                  className="flex-1 rounded-t-[3px] bg-expense"
                  style={{ height: `${expH}px` }}
                />
              </div>
              <span className="text-[10px] font-medium text-text-muted">{bar.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
