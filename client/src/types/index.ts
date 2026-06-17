export type Tab = 'transactions' | 'stats' | 'accounts' | 'settings';
export type TxView = 'daily' | 'calendar' | 'monthly';
export type UnitPosition = 'prefix' | 'suffix';
export type WeekDay =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
}

export interface Account {
  id: number;
  name: string;
  type: string;
  icon: string;
  color: string;
  balance: number;
}

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number;
  amount: number;
  note: string;
  date: string;
  time: string;
  category?: Category;
  account?: Account;
}

export interface UserSettings {
  week_start: WeekDay;
  currency_country: string;
  currency_code: string;
  currency_symbol: string;
  unit_position: UnitPosition;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expenses: number;
}
