import axios from 'axios';
import type {
  Account,
  ApiTransaction,
  Category,
  MonthlySummary,
  UserSettings,
} from '../types/index.ts';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export const fetchSettings = () => api.get<UserSettings>('/settings').then((r) => r.data);

export const patchSettings = (settings: UserSettings) =>
  api.patch<UserSettings>('/settings', settings).then((r) => r.data);

export const fetchCategories = () => api.get<Category[]>('/categories').then((r) => r.data);

export const postCategory = (body: {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}) => api.post<Category>('/categories', body).then((r) => r.data);

export const patchCategory = (id: number, body: { name: string; icon: string; color: string }) =>
  api.patch<Category>(`/categories/${id}`, body).then((r) => r.data);

export const apiDeleteCategory = (id: number) => api.delete(`/categories/${id}`);

export const fetchAccounts = () => api.get<Account[]>('/accounts').then((r) => r.data);

export const fetchTransactions = (year: number, month: number) =>
  api
    .get<ApiTransaction[]>('/transactions', { params: { year, month: month + 1 } })
    .then((r) => r.data);

export const postTransaction = (body: {
  account_id: number;
  category_id: number;
  amount: number;
  note: string;
  tx_date: string;
  tx_time: string;
}) => api.post<ApiTransaction>('/transactions', body).then((r) => r.data);

export const fetchMonthlyStats = () =>
  api.get<MonthlySummary[]>('/stats/monthly').then((r) => r.data);

export const fetchCategoryStats = (year: number, month: number) =>
  api
    .get<
      { id: number; name: string; icon: string; color: string; total: number }[]
    >('/stats/categories', { params: { year, month: month + 1 } })
    .then((r) => r.data);
