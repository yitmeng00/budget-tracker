import type { UserSettings } from '../../types/index.ts';
import { formatMoney } from '../../lib/currency.ts';

const AUTO_COLORS = [
  '#7b5cf0',
  '#2563eb',
  '#f97316',
  '#06b6d4',
  '#f43f5e',
  '#ec4899',
  '#f59e0b',
  '#16a34a',
];

interface TopCategoryItem {
  id: number;
  name: string;
  color: string;
  amount: number; // positive
}

interface Props {
  categories: TopCategoryItem[];
  settings: UserSettings;
}

export default function TopCategories({ categories, settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;

  const top5 = [...categories].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxAbs = top5[0]?.amount ?? 1;

  return (
    <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
      <h3 className="text-sm font-extrabold text-text-primary mb-5">Top Categories</h3>

      <div className="flex flex-col gap-4">
        {top5.map((cat, i) => {
          const pct = (cat.amount / maxAbs) * 100;
          const barColor = AUTO_COLORS[i % AUTO_COLORS.length];
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
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
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
