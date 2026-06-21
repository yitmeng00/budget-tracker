import { formatSigned } from '../../lib/currency.ts';
import type { RawDayGroup } from '../../lib/mockData.ts';
import type { UserSettings } from '../../types/index.ts';
import { getLucideIcon } from '../../lib/icons.ts';

interface Props {
  groups: RawDayGroup[];
  settings: UserSettings;
}

export default function DailyView({ groups, settings }: Props) {
  const { currency_symbol: sym, unit_position: pos } = settings;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const groupTotal = group.items.reduce((s, t) => s + t.amt, 0);

        return (
          <div key={group.dateKey}>
            {/* Day header */}
            <div className="flex items-baseline gap-2.5 mx-1.5 mb-2.5">
              <span className="font-extrabold text-base">{group.label}</span>
              {group.label !== group.date && (
                <span className="text-[13px] text-text-subtle">{group.date}</span>
              )}
              <span
                className={[
                  'ml-auto font-bold text-sm tabular-nums whitespace-nowrap',
                  groupTotal < 0 ? 'text-expense' : 'text-income',
                ].join(' ')}
              >
                {formatSigned(groupTotal, sym, pos)}
              </span>
            </div>

            {/* Transaction list */}
            <div className="bg-surface border border-border rounded-[20px] px-4.5 shadow-(--shadow-card)">
              {group.items.map((tx, i) => {
                const Icon = getLucideIcon(tx.icon);
                const isLast = i === group.items.length - 1;

                return (
                  <div
                    key={tx.id}
                    className={[
                      'flex items-center gap-3.5 py-3.5 px-0.5',
                      !isLast && 'border-b border-bg',
                    ].join(' ')}
                  >
                    <div
                      className="w-11 h-11 shrink-0 rounded-[13px] flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${tx.color} 14%, #ffffff)` }}
                    >
                      <Icon size={20} style={{ color: tx.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px]">{tx.cat}</div>
                      <div className="text-[13px] text-text-subtle truncate">{tx.note}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={[
                          'font-bold text-[15px] tabular-nums whitespace-nowrap',
                          tx.amt < 0 ? 'text-expense' : 'text-income',
                        ].join(' ')}
                      >
                        {formatSigned(tx.amt, sym, pos)}
                      </div>
                      <div className="text-xs text-text-faint mt-0.5 whitespace-nowrap">
                        {tx.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
