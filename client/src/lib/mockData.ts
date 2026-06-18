import type { TxView } from '../types/index.ts';

export interface RawTransaction {
  id: number;
  icon: string;
  cat: string;
  note: string;
  time: string;
  amt: number;
  color: string;
  accountId: number;
}

export interface RawDayGroup {
  label: string;
  date: string;
  dateKey: string;
  items: RawTransaction[];
}

export const MOCK_DAILY_GROUPS: RawDayGroup[] = [
  {
    label: 'Today',
    date: 'Tue, 17 June',
    dateKey: '2026-06-17',
    items: [
      {
        id: 5,
        icon: 'car',
        cat: 'Transport',
        note: 'Grab to office',
        time: '8:10 AM',
        amt: -9.0,
        color: '#06b6d4',
        accountId: 4,
      },
      {
        id: 6,
        icon: 'utensils',
        cat: 'Food & Dining',
        note: 'Nasi Lemak Antarabangsa',
        time: '8:30 AM',
        amt: -12.5,
        color: '#7b5cf0',
        accountId: 1,
      },
      {
        id: 7,
        icon: 'shopping-cart',
        cat: 'Groceries',
        note: 'Jaya Grocer · weekly shop',
        time: '1:15 PM',
        amt: -65.8,
        color: '#22c55e',
        accountId: 3,
      },
    ],
  },
  {
    label: 'Yesterday',
    date: 'Mon, 16 June',
    dateKey: '2026-06-16',
    items: [
      {
        id: 1,
        icon: 'briefcase',
        cat: 'Salary',
        note: 'Monthly salary — Acme Sdn Bhd',
        time: '9:00 AM',
        amt: 5200.0,
        color: '#16a34a',
        accountId: 3,
      },
      {
        id: 2,
        icon: 'clapperboard',
        cat: 'Entertainment',
        note: 'Netflix subscription',
        time: '11:00 AM',
        amt: -17.9,
        color: '#f43f5e',
        accountId: 5,
      },
      {
        id: 3,
        icon: 'coffee',
        cat: 'Food & Dining',
        note: 'ZUS Coffee',
        time: '3:30 PM',
        amt: -9.9,
        color: '#7b5cf0',
        accountId: 1,
      },
      {
        id: 4,
        icon: 'fuel',
        cat: 'Transport',
        note: 'Shell petrol',
        time: '6:00 PM',
        amt: -38.0,
        color: '#06b6d4',
        accountId: 4,
      },
    ],
  },
];

export const TX_VIEW_LABELS: Record<TxView, string> = {
  daily: 'Daily',
  calendar: 'Calendar',
  monthly: 'Monthly',
};
