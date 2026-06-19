import type { Account, TxView } from '../types/index.ts';

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

export interface CalendarDayData {
  income: number;
  expense: number; // negative number
}

export const MOCK_CALENDAR: Record<string, CalendarDayData> = {
  '2026-06-01': { income: 0, expense: -45.5 },
  '2026-06-02': { income: 0, expense: -28.9 },
  '2026-06-03': { income: 0, expense: -110.0 },
  '2026-06-04': { income: 0, expense: -15.0 },
  '2026-06-05': { income: 0, expense: -55.3 },
  '2026-06-06': { income: 0, expense: -220.0 },
  '2026-06-07': { income: 0, expense: -88.5 },
  '2026-06-08': { income: 0, expense: -22.0 },
  '2026-06-09': { income: 0, expense: -35.0 },
  '2026-06-10': { income: 0, expense: -18.5 },
  '2026-06-11': { income: 0, expense: -145.0 },
  '2026-06-12': { income: 0, expense: -67.9 },
  '2026-06-13': { income: 0, expense: -190.0 },
  '2026-06-14': { income: 0, expense: -45.0 },
  '2026-06-15': { income: 800, expense: -32.0 },
  '2026-06-16': { income: 5200, expense: -65.8 },
  '2026-06-17': { income: 0, expense: -87.3 },
  '2026-06-18': { income: 0, expense: -25.0 },
  '2026-06-19': { income: 0, expense: -42.5 },
};

export interface MonthlyCategoryItem {
  id: number;
  name: string;
  icon: string;
  color: string;
  amount: number; // negative = expense, positive = income
}

// Expense totals sum to 3,860 and income to 5,200 — matching SummaryCards mock values
export const MOCK_MONTHLY_CATEGORIES: MonthlyCategoryItem[] = [
  { id: 1, name: 'Food & Dining', icon: 'utensils', color: '#7b5cf0', amount: -950.3 },
  { id: 2, name: 'Shopping', icon: 'shopping-bag', color: '#f97316', amount: -850.0 },
  { id: 3, name: 'Groceries', icon: 'shopping-cart', color: '#22c55e', amount: -680.8 },
  { id: 4, name: 'Transport', icon: 'car', color: '#06b6d4', amount: -520.5 },
  { id: 5, name: 'Entertainment', icon: 'clapperboard', color: '#f43f5e', amount: -320.4 },
  { id: 6, name: 'Bills & Utilities', icon: 'receipt', color: '#64748b', amount: -280.0 },
  { id: 7, name: 'Health', icon: 'heart-pulse', color: '#ec4899', amount: -258.0 },
  { id: 8, name: 'Salary', icon: 'briefcase', color: '#16a34a', amount: 5200.0 },
];

export interface MonthlyBarData {
  month: string;
  income: number;
  expense: number;
}

export const MOCK_MONTHLY_BARS: MonthlyBarData[] = [
  { month: 'Jan', income: 5200, expense: 3200 },
  { month: 'Feb', income: 5200, expense: 2800 },
  { month: 'Mar', income: 5200, expense: 4100 },
  { month: 'Apr', income: 6000, expense: 3600 },
  { month: 'May', income: 5200, expense: 3450 },
  { month: 'Jun', income: 5200, expense: 3860 },
];

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 1,
    name: 'CIMB Current',
    type: 'Current Account',
    icon: 'landmark',
    color: '#2563eb',
    balance: 12450.0,
  },
  {
    id: 2,
    name: 'Maybank Savings',
    type: 'Savings Account',
    icon: 'piggy-bank',
    color: '#16a34a',
    balance: 8320.5,
  },
  {
    id: 3,
    name: "Touch 'n Go",
    type: 'E-Wallet',
    icon: 'wallet',
    color: '#06b6d4',
    balance: 285.4,
  },
  {
    id: 4,
    name: 'CIMB Visa',
    type: 'Credit Card',
    icon: 'credit-card',
    color: '#ef4444',
    balance: -1250.0,
  },
  {
    id: 5,
    name: 'Grab Wallet',
    type: 'E-Wallet',
    icon: 'smartphone',
    color: '#22c55e',
    balance: 45.0,
  },
];

export const TX_VIEW_LABELS: Record<TxView, string> = {
  daily: 'Daily',
  calendar: 'Calendar',
  monthly: 'Monthly',
};
