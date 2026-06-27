import type { UserSettings } from '../../types/index.ts';
import { formatMoney } from '../../lib/currency.ts';

interface CategoryItem {
  id: number;
  name: string;
  color: string;
  amount: number;
}

interface Props {
  income: CategoryItem[];
  expenses: CategoryItem[];
  settings: UserSettings;
}

function CategoryList({ items, settings }: { items: CategoryItem[]; settings: UserSettings }) {
  const { currency_symbol: sym, unit_position: pos } = settings;
  const maxAmt = items[0]?.amount ?? 1;

  if (items.length === 0) {
    return <p className="text-xs text-text-muted py-2">No data for this period</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((cat) => {
        const pct = (cat.amount / maxAmt) * 100;
        return (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-text-primary flex-1 min-w-0 truncate">
                {cat.name}
              </span>
              <span className="text-sm font-bold text-text-primary tabular-nums shrink-0">
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
  );
}

export default function CategoryBreakdown({ income, expenses, settings }: Props) {
  return (
    <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
      <h3 className="text-sm font-extrabold text-text-primary mb-5">Categories</h3>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold text-income uppercase tracking-wide mb-3">Income</p>
          <CategoryList items={income} settings={settings} />
        </div>
        <div>
          <p className="text-xs font-bold text-expense uppercase tracking-wide mb-3">Expenses</p>
          <CategoryList items={expenses} settings={settings} />
        </div>
      </div>
    </div>
  );
}
