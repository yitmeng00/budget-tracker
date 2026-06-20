import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TxView, UserSettings, ApiTransaction } from '../types/index.ts';
import type { CalendarDayData, MonthlyCategoryItem, RawDayGroup } from '../lib/mockData.ts';
import { fetchTransactions } from '../lib/api.ts';
import SummaryCards from '../components/transactions/SummaryCards.tsx';
import ViewSwitcher from '../components/transactions/ViewSwitcher.tsx';
import DailyView from '../components/transactions/DailyView.tsx';
import CalendarView from '../components/transactions/CalendarView.tsx';
import MonthlyView from '../components/transactions/MonthlyView.tsx';

interface Props {
  year: number;
  month: number; // 0-indexed
  settings: UserSettings;
}

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const buildDateLabel = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
};

const buildDayLabel = (dateStr: string) => {
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (dateStr === localDateStr(today)) return 'Today';
  if (dateStr === localDateStr(yest)) return 'Yesterday';
  return buildDateLabel(dateStr);
};

const buildDailyGroups = (txs: ApiTransaction[]): RawDayGroup[] => {
  const dateMap = new Map<string, ApiTransaction[]>();
  for (const tx of txs) {
    const list = dateMap.get(tx.tx_date) ?? [];
    list.push(tx);
    dateMap.set(tx.tx_date, list);
  }
  const dates = [...new Set(txs.map((t) => t.tx_date))];
  return dates.map((dateStr) => ({
    label: buildDayLabel(dateStr),
    date: buildDateLabel(dateStr),
    dateKey: dateStr,
    items: (dateMap.get(dateStr) ?? []).map((tx) => ({
      id: tx.id,
      icon: tx.category_icon,
      cat: tx.category_name,
      note: tx.note,
      time: formatTime(tx.tx_time),
      amt: tx.amount,
      color: tx.category_color,
      accountId: tx.account_id,
    })),
  }));
};

const buildCalendarData = (txs: ApiTransaction[]): Record<string, CalendarDayData> => {
  const result: Record<string, CalendarDayData> = {};
  for (const tx of txs) {
    if (!result[tx.tx_date]) result[tx.tx_date] = { income: 0, expense: 0 };
    if (tx.amount > 0) result[tx.tx_date].income += tx.amount;
    else result[tx.tx_date].expense += tx.amount;
  }
  return result;
};

const buildMonthlyCategories = (txs: ApiTransaction[]): MonthlyCategoryItem[] => {
  const map = new Map<number, MonthlyCategoryItem>();
  for (const tx of txs) {
    const existing = map.get(tx.category_id);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      map.set(tx.category_id, {
        id: tx.category_id,
        name: tx.category_name,
        icon: tx.category_icon,
        color: tx.category_color,
        amount: tx.amount,
      });
    }
  }
  return Array.from(map.values());
};

export default function TransactionsPage({ year, month, settings }: Props) {
  const [view, setView] = useState<TxView>('daily');

  const { data: txs = [] } = useQuery({
    queryKey: ['transactions', year, month],
    queryFn: () => fetchTransactions(year, month),
  });

  const totalIncome = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const dailyGroups = buildDailyGroups(txs);
  const calendarData = buildCalendarData(txs);
  const monthlyCategories = buildMonthlyCategories(txs);

  return (
    <div>
      <SummaryCards income={totalIncome} expenses={totalExpenses} settings={settings} />
      <ViewSwitcher active={view} onChange={setView} />

      {view === 'daily' && <DailyView groups={dailyGroups} settings={settings} />}
      {view === 'calendar' && (
        <CalendarView
          key={`${year}-${month}`}
          year={year}
          month={month}
          settings={settings}
          calendarData={calendarData}
        />
      )}
      {view === 'monthly' && <MonthlyView categories={monthlyCategories} settings={settings} />}
    </div>
  );
}
