import type { UserSettings } from '../../types/index.ts';
import { MOCK_MONTHLY_CATEGORIES } from '../../lib/mockData.ts';
import { getLucideIcon } from '../../lib/icons.ts';
import { formatMoney } from '../../lib/currency.ts';

interface Props {
  settings: UserSettings;
}

export default function TopCategories({ settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;

  const top5 = MOCK_MONTHLY_CATEGORIES.filter((c) => c.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 5);

  const maxAbs = Math.abs(top5[0]?.amount ?? 1);

  return (
    <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
      <h3 className="text-sm font-extrabold text-text-primary mb-5">Top Categories</h3>

      <div className="flex flex-col gap-4">
        {top5.map((cat) => {
          const Icon = getLucideIcon(cat.icon);
          const pct = (Math.abs(cat.amount) / maxAbs) * 100;
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${cat.color} 14%, #ffffff)` }}
                >
                  <Icon size={17} style={{ color: cat.color }} />
                </div>
                <span className="text-sm font-semibold text-text-primary flex-1 min-w-0 truncate">
                  {cat.name}
                </span>
                <span className="text-sm font-bold text-text-primary tabular-nums shrink-0">
                  {formatMoney(Math.abs(cat.amount), sym, pos)}
                </span>
              </div>
              <div className="ml-12 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
