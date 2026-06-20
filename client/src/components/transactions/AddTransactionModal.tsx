import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { UserSettings } from '../../types/index.ts';
import { fetchAccounts, fetchCategories, postTransaction } from '../../lib/api.ts';

interface Props {
  onClose: () => void;
  settings: UserSettings;
}

interface FormState {
  type: 'income' | 'expense';
  amount: string;
  categoryId: number | '';
  accountId: number | '';
  date: string;
  note: string;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fieldCls =
  'w-full text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2.5 outline-none focus:border-accent transition-colors';

const labelCls = 'text-xs font-bold text-text-muted mb-1.5 block';

export default function AddTransactionModal({ onClose, settings }: Props) {
  const [form, setForm] = useState<FormState>({
    type: 'expense',
    amount: '',
    categoryId: '',
    accountId: '',
    date: localToday(),
    note: '',
  });

  const switchType = (t: 'income' | 'expense') =>
    setForm((prev) => ({ ...prev, type: t, categoryId: '' }));

  const queryClient = useQueryClient();

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: postTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  const filteredCategories = allCategories.filter((c) => c.type === form.type);

  const canSubmit =
    form.amount !== '' &&
    Number(form.amount) > 0 &&
    form.categoryId !== '' &&
    form.accountId !== '';

  const handleSubmit = () => {
    if (!canSubmit || isPending) return;
    const now = new Date();
    const txTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const rawAmt = Math.abs(Number(form.amount));
    mutate({
      account_id: form.accountId as number,
      category_id: form.categoryId as number,
      amount: form.type === 'expense' ? -rawAmt : rawAmt,
      note: form.note,
      tx_date: form.date,
      tx_time: txTime,
    });
  };

  const { currency_symbol: sym, unit_position: pos } = settings;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(31,27,46,0.4)] flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl shadow-xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-extrabold text-text-primary">Add Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-border border-0 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-1 bg-border rounded-[13px] p-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={[
                  'flex-1 py-2 rounded-[10px] text-sm font-bold border-0 cursor-pointer transition-all duration-150',
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-surface text-expense shadow-sm'
                      : 'bg-surface text-income shadow-sm'
                    : 'bg-transparent text-text-muted hover:text-text-primary',
                ].join(' ')}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Amount</label>
            <div className="relative">
              {pos === 'prefix' && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-text-muted select-none">
                  {sym}
                </span>
              )}
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className={[
                  'w-full text-xl font-extrabold text-text-primary bg-bg border border-border rounded-[11px] py-3 outline-none focus:border-accent transition-colors tabular-nums',
                  pos === 'prefix' ? 'pl-12 pr-4' : 'pl-4 pr-12',
                ].join(' ')}
              />
              {pos === 'suffix' && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-text-muted select-none">
                  {sym}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  categoryId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              className={fieldCls}
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className={labelCls}>Account</label>
            <select
              value={form.accountId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  accountId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              className={fieldCls}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className={fieldCls}
            />
          </div>

          {/* Note */}
          <div>
            <label className={labelCls}>
              Note <span className="font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Add a note..."
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              className={fieldCls}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-[13px] bg-accent text-white text-sm font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Add Transaction
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[13px] bg-bg text-text-muted text-sm font-semibold border border-border cursor-pointer hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
