import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Account, Category, UnitPosition, UserSettings, WeekDay } from '../types/index.ts';
import {
  fetchCategories,
  postCategory,
  patchCategory,
  fetchBudgets,
  putBudgetDefault,
  deleteAllBudgets,
  putBudgetOverride,
  deleteBudgetOverride,
  deleteCategory,
  fetchAccountGroups,
  postAccountGroup,
  patchAccountGroup,
  deleteAccountGroup,
  fetchAccounts,
  patchAccount,
  postAccount,
} from '../lib/api.ts';
import { formatMoney } from '../lib/currency.ts';

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

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

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

interface Props {
  year: number;
  month: number; // 0-indexed
  settings: UserSettings;
  onUpdate: (patch: Partial<UserSettings>) => void;
}

const WEEK_START_OPTIONS: { label: string; value: WeekDay }[] = [
  { label: 'Sunday', value: 'Sunday' },
  { label: 'Monday', value: 'Monday' },
  { label: 'Saturday', value: 'Saturday' },
];

interface CurrencyPreset {
  code: string;
  symbol: string;
  country: string;
  position: UnitPosition;
}

const CURRENCY_PRESETS: CurrencyPreset[] = [
  { code: 'MYR', symbol: 'RM', country: 'Malaysia', position: 'prefix' },
  { code: 'USD', symbol: '$', country: 'United States', position: 'prefix' },
  { code: 'EUR', symbol: '€', country: 'Eurozone', position: 'suffix' },
  { code: 'GBP', symbol: '£', country: 'United Kingdom', position: 'prefix' },
  { code: 'JPY', symbol: '¥', country: 'Japan', position: 'prefix' },
];

interface NewCategoryForm {
  name: string;
  type: 'income' | 'expense';
}

export default function SettingsPage({ year, month, settings, onUpdate }: Props) {
  const queryClient = useQueryClient();
  const { currency_symbol: sym, unit_position: pos } = settings;

  // ── Categories ────────────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddType, setShowAddType] = useState<'income' | 'expense' | null>(null);
  const [newCat, setNewCat] = useState<NewCategoryForm>({ name: '', type: 'expense' });

  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, cat }: { id: number; cat: Category }) =>
      patchCategory(id, { name: editName.trim(), icon: cat.icon, color: cat.color }),
    onSuccess: invalidateCategories,
  });

  const addMutation = useMutation({
    mutationFn: (body: { name: string; type: 'income' | 'expense'; icon: string; color: string }) =>
      postCategory(body),
    onSuccess: invalidateCategories,
  });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };
  const saveEdit = () => {
    if (!editName.trim() || editingId === null) return;
    const cat = categories.find((c) => c.id === editingId);
    if (cat) updateMutation.mutate({ id: editingId, cat });
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const openAddForm = (type: 'income' | 'expense') => {
    setShowAddType(type);
    setNewCat({ name: '', type });
  };
  const closeAddForm = () => setShowAddType(null);
  const addCategory = () => {
    if (!newCat.name.trim()) return;
    const color = AUTO_COLORS[categories.length % AUTO_COLORS.length];
    addMutation.mutate({ name: newCat.name.trim(), type: newCat.type, icon: 'tag', color });
    closeAddForm();
  };

  // ── Delete category ───────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{
    cat: Category;
    reassignTo: number | null;
    error: string | null;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: ({ id, reassignTo }: { id: number; reassignTo?: number }) =>
      deleteCategory(id, reassignTo),
    onSuccess: () => {
      invalidateCategories();
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDeleteModal(null);
    },
    onError: (err: unknown) => {
      const response = (
        err as { response?: { status: number; data?: { transactionCount: number } } }
      )?.response;
      const count = response?.data?.transactionCount;
      const errorMsg =
        response?.status === 409
          ? `This category has ${count} transaction${count === 1 ? '' : 's'}. Select a category to reassign them to.`
          : 'Failed to delete category. Please try again.';
      setDeleteModal((prev) => (prev ? { ...prev, error: errorMsg } : prev));
    },
  });

  const openDeleteModal = (cat: Category) => setDeleteModal({ cat, reassignTo: null, error: null });

  const submitCategoryDelete = () => {
    if (!deleteModal) return;
    deleteMutation.mutate({
      id: deleteModal.cat.id,
      reassignTo: deleteModal.reassignTo ?? undefined,
    });
  };

  // ── Account Groups ────────────────────────────────────────────────────────
  const { data: accountGroups = [] } = useQuery({
    queryKey: ['account-groups'],
    queryFn: fetchAccountGroups,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupDeleteError, setGroupDeleteError] = useState<number | null>(null);

  const addGroupMutation = useMutation({
    mutationFn: (name: string) => postAccountGroup(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => patchAccountGroup(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
  });
  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => deleteAccountGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-groups'] }),
    onError: (_err, id) => setGroupDeleteError(id),
  });

  const saveGroupEdit = () => {
    if (!editGroupName.trim() || editingGroupId === null) return;
    updateGroupMutation.mutate({ id: editingGroupId, name: editGroupName.trim() });
    setEditingGroupId(null);
  };

  // ── Accounts (settings) ───────────────────────────────────────────────────
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editAccountDraft, setEditAccountDraft] = useState<{
    name: string;
    balance: string;
    group_id: number | null;
  }>({ name: '', balance: '', group_id: null });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountDraft, setNewAccountDraft] = useState({
    name: '',
    balance: '',
    group_id: null as number | null,
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof patchAccount>[1] }) =>
      patchAccount(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
  const addAccountMutation = useMutation({
    mutationFn: (body: Parameters<typeof postAccount>[0]) => postAccount(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowAddAccount(false);
      setNewAccountDraft({ name: '', balance: '', group_id: null });
    },
  });

  const startAccountEdit = (acc: Account) => {
    setEditingAccountId(acc.id);
    setEditAccountDraft({ name: acc.name, balance: String(acc.balance), group_id: acc.group_id });
  };
  const saveAccountEdit = () => {
    if (!editingAccountId || !editAccountDraft.name.trim()) return;
    const balanceNum = parseFloat(editAccountDraft.balance);
    updateAccountMutation.mutate({
      id: editingAccountId,
      data: {
        name: editAccountDraft.name.trim(),
        balance: isNaN(balanceNum) ? 0 : balanceNum,
        group_id: editAccountDraft.group_id,
      },
    });
    setEditingAccountId(null);
  };
  const submitAddAccount = () => {
    if (!newAccountDraft.name.trim()) return;
    const balanceNum = parseFloat(newAccountDraft.balance);
    addAccountMutation.mutate({
      name: newAccountDraft.name.trim(),
      type: 'Wallet',
      balance: isNaN(balanceNum) ? 0 : balanceNum,
      group_id: newAccountDraft.group_id,
    });
  };

  // ── Budgets — independent month navigation ────────────────────────────────
  const [budgetYear, setBudgetYear] = useState(year);
  const [budgetMonth, setBudgetMonth] = useState(month); // 0-indexed
  const budgetApiMonth = budgetMonth + 1; // 1-indexed for API/DB

  const goBudgetPrev = () => {
    setBudgetModal(null);
    if (budgetMonth === 0) {
      setBudgetYear((y) => y - 1);
      setBudgetMonth(11);
    } else setBudgetMonth((m) => m - 1);
  };
  const goBudgetNext = () => {
    setBudgetModal(null);
    if (budgetMonth === 11) {
      setBudgetYear((y) => y + 1);
      setBudgetMonth(0);
    } else setBudgetMonth((m) => m + 1);
  };

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', budgetYear, budgetApiMonth],
    queryFn: () => fetchBudgets(budgetYear, budgetApiMonth),
  });

  // Next month values (used for "Update default from next month" action)
  const nextApiMonth = budgetApiMonth === 12 ? 1 : budgetApiMonth + 1;
  const nextYear = budgetApiMonth === 12 ? budgetYear + 1 : budgetYear;
  const nextMonthLabel = `${MONTH_SHORT[nextApiMonth - 1]} ${nextYear}`;
  const currentMonthLabel = `${MONTH_SHORT[budgetMonth]} ${budgetYear}`;

  const invalidateAllBudgets = () => queryClient.invalidateQueries({ queryKey: ['budgets'] });
  const invalidateMonthBudgets = () =>
    queryClient.invalidateQueries({ queryKey: ['budgets', budgetYear, budgetApiMonth] });

  const upsertDefaultMutation = useMutation({
    mutationFn: (v: {
      categoryId: number;
      startYear: number;
      startMonth: number;
      amount: number;
    }) => putBudgetDefault(v.categoryId, v.startYear, v.startMonth, v.amount),
    onSuccess: invalidateAllBudgets,
  });

  const removeAllMutation = useMutation({
    mutationFn: (categoryId: number) => deleteAllBudgets(categoryId),
    onSuccess: invalidateAllBudgets,
  });

  const upsertOverrideMutation = useMutation({
    mutationFn: (v: { categoryId: number; amount: number }) =>
      putBudgetOverride(v.categoryId, budgetYear, budgetApiMonth, v.amount),
    onSuccess: invalidateMonthBudgets,
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (categoryId: number) =>
      deleteBudgetOverride(categoryId, budgetYear, budgetApiMonth),
    onSuccess: invalidateMonthBudgets,
  });

  const getBudgetEntry = (categoryId: number) => budgets.find((b) => b.category_id === categoryId);

  // ── Budget modal ──────────────────────────────────────────────────────────
  const [budgetModal, setBudgetModal] = useState<{ cat: Category } | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<'override' | 'all' | null>(null);

  const openBudgetModal = (cat: Category) => {
    const entry = getBudgetEntry(cat.id);
    // Pre-fill with override if exists, else effective default
    const prefill = entry?.override_amount ?? entry?.default_amount;
    setModalAmount(prefill != null ? String(prefill) : '');
    setConfirmDelete(null);
    setBudgetModal({ cat });
  };

  const modalEntry = budgetModal ? getBudgetEntry(budgetModal.cat.id) : null;
  const modalHasDefault = (modalEntry?.default_amount ?? null) !== null;
  const modalHasOverride = (modalEntry?.override_amount ?? null) !== null;
  const modalAmountValid = parseFloat(modalAmount) > 0 && !isNaN(parseFloat(modalAmount));

  const handleSetDefault = (startYear: number, startMonth: number) => {
    if (!budgetModal || !modalAmountValid) return;
    upsertDefaultMutation.mutate({
      categoryId: budgetModal.cat.id,
      startYear,
      startMonth,
      amount: parseFloat(modalAmount),
    });
    setBudgetModal(null);
  };

  const handleOverrideMonth = () => {
    if (!budgetModal || !modalAmountValid) return;
    upsertOverrideMutation.mutate({
      categoryId: budgetModal.cat.id,
      amount: parseFloat(modalAmount),
    });
    setBudgetModal(null);
  };

  const handleRemoveOverride = () => {
    if (!budgetModal) return;
    deleteOverrideMutation.mutate(budgetModal.cat.id);
    setBudgetModal(null);
  };

  const handleRemoveAll = () => {
    if (!budgetModal) return;
    removeAllMutation.mutate(budgetModal.cat.id);
    setBudgetModal(null);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="flex flex-col gap-4">
      {/* Preferences */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <h3 className="text-sm font-extrabold text-text-primary mb-5">Preferences</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-primary">Week starts on</div>
            <div className="text-xs text-text-muted mt-0.5">Affects the calendar view headers</div>
          </div>
          <div className="flex gap-1 bg-border rounded-[11px] p-1">
            {WEEK_START_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => onUpdate({ week_start: value })}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all duration-150',
                  settings.week_start === value
                    ? 'bg-surface text-accent shadow-[0_2px_8px_rgba(37,99,235,0.12)]'
                    : 'bg-transparent text-text-muted hover:text-text-primary',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text-primary">Symbol position</div>
            <div className="text-xs text-text-muted mt-0.5">
              Example:{' '}
              {settings.unit_position === 'prefix'
                ? `${settings.currency_symbol} 100.00`
                : `100.00 ${settings.currency_symbol}`}
            </div>
          </div>
          <div className="flex gap-1 bg-border rounded-[11px] p-1">
            {(['prefix', 'suffix'] as UnitPosition[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ unit_position: p })}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all duration-150 capitalize',
                  settings.unit_position === p
                    ? 'bg-surface text-accent shadow-[0_2px_8px_rgba(37,99,235,0.12)]'
                    : 'bg-transparent text-text-muted hover:text-text-primary',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <h3 className="text-sm font-extrabold text-text-primary mb-5">Currency</h3>
        <div className="grid grid-cols-5 gap-2">
          {CURRENCY_PRESETS.map((c) => {
            const active = settings.currency_code === c.code;
            return (
              <button
                key={c.code}
                onClick={() =>
                  onUpdate({
                    currency_country: c.country,
                    currency_code: c.code,
                    currency_symbol: c.symbol,
                    unit_position: c.position,
                  })
                }
                className={[
                  'flex flex-col items-center gap-1.5 py-3 rounded-[13px] border-2 cursor-pointer transition-all duration-150',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-border bg-bg hover:border-accent/50',
                ].join(' ')}
              >
                <span
                  className={`text-base font-extrabold ${active ? 'text-accent' : 'text-text-primary'}`}
                >
                  {c.symbol}
                </span>
                <span
                  className={`text-[10px] font-semibold ${active ? 'text-accent' : 'text-text-muted'}`}
                >
                  {c.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <h3 className="text-sm font-extrabold text-text-primary mb-5">
          Categories
          <span className="ml-2 text-xs font-semibold text-text-muted">
            {categories.length} total
          </span>
        </h3>

        {(['expense', 'income'] as const).map((sectionType, si) => {
          const sectionCats = categories.filter((c) => c.type === sectionType);
          const isAddingHere = showAddType === sectionType;
          return (
            <div key={sectionType} className={si > 0 ? 'mt-5 pt-5 border-t border-border' : ''}>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: sectionType === 'income' ? '#16a34a' : '#ef4444' }}
                >
                  {sectionType}
                </span>
                {!isAddingHere && (
                  <button
                    onClick={() => openAddForm(sectionType)}
                    className="flex items-center gap-1 text-[11px] font-bold text-accent border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity p-0"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                )}
              </div>

              {isAddingHere && (
                <div
                  className={[
                    'flex flex-col gap-3',
                    sectionCats.length > 0 ? 'mb-3 pb-3 border-b border-bg' : '',
                  ].join(' ')}
                >
                  <input
                    autoFocus
                    placeholder="Category name"
                    value={newCat.name}
                    onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCategory();
                      if (e.key === 'Escape') closeAddForm();
                    }}
                    className="w-full text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2 outline-none focus:border-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addCategory}
                      disabled={!newCat.name.trim()}
                      className="px-4 py-2 rounded-[11px] bg-accent text-white text-xs font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      Add Category
                    </button>
                    <button
                      onClick={closeAddForm}
                      className="px-4 py-2 rounded-[11px] bg-bg text-text-muted text-xs font-semibold border border-border cursor-pointer hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                {sectionCats.map((cat, i) => {
                  const isLast = i === sectionCats.length - 1;
                  const isEditing = editingId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={[
                        'flex items-center gap-3 py-2.5',
                        !isLast ? 'border-b border-bg' : '',
                      ].join(' ')}
                    >
                      {isEditing ? (
                        <>
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 text-sm font-semibold text-text-primary bg-bg border border-accent rounded-lg px-2 py-1 outline-none"
                          />
                          <button
                            onClick={saveEdit}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-accent text-white border-0 cursor-pointer shrink-0"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-border text-text-muted border-0 cursor-pointer shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-text-primary flex-1">
                            {cat.name}
                          </span>
                          <button
                            onClick={() => startEdit(cat)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-accent hover:bg-accent-soft border-0 cursor-pointer transition-colors shrink-0"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(cat)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-expense hover:bg-expense/10 border-0 cursor-pointer transition-colors shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accounts */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        <h3 className="text-sm font-extrabold text-text-primary mb-5">Accounts</h3>

        {/* — Groups sub-section — */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Groups
            </span>
            {!showAddGroup && (
              <button
                onClick={() => {
                  setShowAddGroup(true);
                  setNewGroupName('');
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-accent border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity p-0"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {showAddGroup && (
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newGroupName.trim()) {
                    addGroupMutation.mutate(newGroupName.trim());
                    setShowAddGroup(false);
                    setNewGroupName('');
                  }
                  if (e.key === 'Escape') setShowAddGroup(false);
                }}
                className="flex-1 text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2 outline-none focus:border-accent"
              />
              <button
                onClick={() => {
                  if (newGroupName.trim()) {
                    addGroupMutation.mutate(newGroupName.trim());
                    setShowAddGroup(false);
                    setNewGroupName('');
                  }
                }}
                disabled={!newGroupName.trim()}
                className="px-3 py-2 rounded-[11px] bg-accent text-white text-xs font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddGroup(false)}
                className="px-3 py-2 rounded-[11px] bg-bg text-text-muted text-xs font-semibold border border-border cursor-pointer hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-col">
            {accountGroups
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((group, i, arr) => {
                const isEditingGroup = editingGroupId === group.id;
                const isLast = i === arr.length - 1;
                return (
                  <div
                    key={group.id}
                    className={[
                      'flex items-center gap-3 py-2.5',
                      !isLast ? 'border-b border-bg' : '',
                    ].join(' ')}
                  >
                    {isEditingGroup ? (
                      <>
                        <input
                          autoFocus
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveGroupEdit();
                            if (e.key === 'Escape') setEditingGroupId(null);
                          }}
                          className="flex-1 text-sm font-semibold text-text-primary bg-bg border border-accent rounded-lg px-2 py-1 outline-none"
                        />
                        <button
                          onClick={saveGroupEdit}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-accent text-white border-0 cursor-pointer shrink-0"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-border text-text-muted border-0 cursor-pointer shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-text-primary flex-1">
                          {group.name}
                        </span>
                        {groupDeleteError === group.id && (
                          <span className="text-[11px] text-expense mr-1">Has accounts</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingGroupId(group.id);
                            setEditGroupName(group.name);
                            setGroupDeleteError(null);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-accent hover:bg-accent-soft border-0 cursor-pointer transition-colors shrink-0"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setGroupDeleteError(null);
                            deleteGroupMutation.mutate(group.id);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-expense hover:bg-expense/10 border-0 cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* — Accounts sub-section — */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Account list
            </span>
            {!showAddAccount && (
              <button
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-accent border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity p-0"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {showAddAccount && (
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-bg">
              <input
                autoFocus
                placeholder="Account name"
                value={newAccountDraft.name}
                onChange={(e) => setNewAccountDraft((p) => ({ ...p, name: e.target.value }))}
                className="w-full text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2 outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Balance"
                  value={newAccountDraft.balance}
                  onChange={(e) => setNewAccountDraft((p) => ({ ...p, balance: e.target.value }))}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="flex-1 text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2 outline-none focus:border-accent"
                />
                <select
                  value={newAccountDraft.group_id ?? ''}
                  onChange={(e) =>
                    setNewAccountDraft((p) => ({
                      ...p,
                      group_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="flex-1 text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2 outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">No group</option>
                  {accountGroups
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitAddAccount}
                  disabled={!newAccountDraft.name.trim() || addAccountMutation.isPending}
                  className="px-4 py-2 rounded-[11px] bg-accent text-white text-xs font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  Add Account
                </button>
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="px-4 py-2 rounded-[11px] bg-bg text-text-muted text-xs font-semibold border border-border cursor-pointer hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col">
            {accounts.map((acc, i) => {
              const isEditingAcc = editingAccountId === acc.id;
              const isLast = i === accounts.length - 1;
              const groupName = accountGroups.find((g) => g.id === acc.group_id)?.name;
              return (
                <div
                  key={acc.id}
                  className={[
                    'flex items-center gap-3 py-2.5',
                    !isLast ? 'border-b border-bg' : '',
                  ].join(' ')}
                >
                  {isEditingAcc ? (
                    <>
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <input
                          autoFocus
                          value={editAccountDraft.name}
                          onChange={(e) =>
                            setEditAccountDraft((p) => ({ ...p, name: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveAccountEdit();
                            if (e.key === 'Escape') setEditingAccountId(null);
                          }}
                          className="text-sm font-semibold text-text-primary bg-bg border border-accent rounded-lg px-2 py-1 outline-none w-full"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={editAccountDraft.balance}
                            onChange={(e) =>
                              setEditAccountDraft((p) => ({ ...p, balance: e.target.value }))
                            }
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="flex-1 min-w-0 text-xs font-semibold text-text-primary bg-bg border border-border rounded-lg px-2 py-1 outline-none focus:border-accent"
                          />
                          <select
                            value={editAccountDraft.group_id ?? ''}
                            onChange={(e) =>
                              setEditAccountDraft((p) => ({
                                ...p,
                                group_id: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            className="flex-1 min-w-0 text-xs font-semibold text-text-primary bg-bg border border-border rounded-lg px-2 py-1 outline-none focus:border-accent cursor-pointer"
                          >
                            <option value="">No group</option>
                            {accountGroups
                              .slice()
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={saveAccountEdit}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-accent text-white border-0 cursor-pointer shrink-0"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingAccountId(null)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-border text-text-muted border-0 cursor-pointer shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate">
                          {acc.name}
                        </div>
                        <div className="text-xs text-text-muted">{groupName ?? 'No group'}</div>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-text-primary shrink-0">
                        {formatMoney(acc.balance, sym, pos)}
                      </span>
                      <button
                        onClick={() => startAccountEdit(acc)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-accent hover:bg-accent-soft border-0 cursor-pointer transition-colors shrink-0"
                      >
                        <Pencil size={13} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budgets */}
      <div className="bg-surface border border-border rounded-[20px] shadow-(--shadow-card) p-5">
        {/* Budget section header with independent month navigation */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-extrabold text-text-primary">Budgets</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={goBudgetPrev}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-border border-0 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-text-muted w-20 text-center tabular-nums">
              {MONTH_LONG[budgetMonth]} {budgetYear}
            </span>
            <button
              onClick={goBudgetNext}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-border border-0 cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <p className="text-xs text-text-muted mb-5">
          Set a default monthly limit per expense category. Override specific months as needed.
        </p>

        <div className="flex flex-col">
          {expenseCategories.map((cat, i) => {
            const entry = getBudgetEntry(cat.id);
            const effectiveAmount = entry ? (entry.override_amount ?? entry.default_amount) : null;
            const hasOverride = (entry?.override_amount ?? null) !== null;
            const isLast = i === expenseCategories.length - 1;

            return (
              <div
                key={cat.id}
                className={[
                  'flex items-center gap-3 py-3',
                  !isLast ? 'border-b border-bg' : '',
                ].join(' ')}
              >
                <span className="text-sm font-semibold text-text-primary flex-1 min-w-0 truncate">
                  {cat.name}
                </span>

                {effectiveAmount != null ? (
                  <div className="flex items-center gap-2 shrink-0">
                    {hasOverride && (
                      <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md leading-none">
                        Override
                      </span>
                    )}
                    <span className="text-sm font-bold text-text-primary tabular-nums">
                      {formatMoney(effectiveAmount, sym, pos)}/mo
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-text-faint shrink-0">No limit</span>
                )}

                <button
                  onClick={() => openBudgetModal(cat)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-text-faint hover:text-accent hover:bg-accent-soft border-0 cursor-pointer transition-colors shrink-0"
                >
                  <Pencil size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget modal */}
      {budgetModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setBudgetModal(null)}
        >
          <div
            className="bg-surface rounded-t-3xl sm:rounded-3xl shadow-xl p-6 w-full sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-text-primary">
                  {budgetModal.cat.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Monthly budget · {currentMonthLabel}
                </p>
              </div>
              <button
                onClick={() => setBudgetModal(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-border text-text-muted border-0 cursor-pointer hover:text-text-primary transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Current budget summary (only when default exists) */}
            {modalHasDefault && (
              <div className="bg-bg rounded-[13px] p-3 mb-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Default</span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {formatMoney(modalEntry!.default_amount!, sym, pos)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{currentMonthLabel}</span>
                  <span
                    className={[
                      'text-xs font-bold tabular-nums',
                      modalHasOverride ? 'text-accent' : 'text-text-muted',
                    ].join(' ')}
                  >
                    {modalHasOverride
                      ? `${formatMoney(modalEntry!.override_amount!, sym, pos)}/mo (override)`
                      : 'Using default'}
                  </span>
                </div>
              </div>
            )}

            {/* Amount input */}
            <label className="text-xs font-semibold text-text-muted block mb-1.5">
              {modalHasDefault ? 'New amount' : 'Monthly amount'}
            </label>
            <div className="relative mb-4">
              {settings.unit_position === 'prefix' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted select-none">
                  {settings.currency_symbol}
                </span>
              )}
              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={modalAmount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setModalAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setBudgetModal(null);
                }}
                className={[
                  'w-full text-base font-bold text-text-primary bg-bg border-2 border-border rounded-[13px] py-3 outline-none focus:border-accent tabular-nums transition-colors',
                  settings.unit_position === 'prefix' ? 'pl-10 pr-4' : 'pl-4 pr-10',
                ].join(' ')}
              />
              {settings.unit_position === 'suffix' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted select-none">
                  {settings.currency_symbol}
                </span>
              )}
            </div>

            {/* Action buttons */}
            {!modalHasDefault ? (
              // First-time: single button sets default from this month onwards
              <button
                onClick={() => handleSetDefault(budgetYear, budgetApiMonth)}
                disabled={!modalAmountValid}
                className="w-full py-3 rounded-[13px] bg-accent text-white text-sm font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Set from {currentMonthLabel} onwards
              </button>
            ) : (
              // Edit: two main actions
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSetDefault(nextYear, nextApiMonth)}
                  disabled={!modalAmountValid}
                  className="w-full py-3 rounded-[13px] bg-accent text-white text-sm font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  Update default from {nextMonthLabel} →
                </button>
                <button
                  onClick={handleOverrideMonth}
                  disabled={!modalAmountValid}
                  className="w-full py-3 rounded-[13px] border-2 border-accent text-accent text-sm font-bold bg-transparent cursor-pointer hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {currentMonthLabel} only
                </button>
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex flex-col gap-0 mt-3">
              {modalHasOverride &&
                (confirmDelete === 'override' ? (
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="text-xs text-text-muted flex-1">
                      Remove {currentMonthLabel} override?
                    </span>
                    <button
                      onClick={handleRemoveOverride}
                      className="px-3 py-1 text-xs font-bold text-white bg-expense rounded-lg border-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      Yes, remove
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs font-semibold text-text-muted bg-surface rounded-lg border border-border cursor-pointer hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete('override')}
                    className="w-full py-2 text-xs font-semibold text-text-muted border-0 bg-transparent cursor-pointer hover:text-text-primary transition-colors"
                  >
                    Remove {currentMonthLabel} override
                  </button>
                ))}
              {modalHasDefault &&
                (confirmDelete === 'all' ? (
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="text-xs text-text-muted flex-1">
                      Remove all budgets for this category?
                    </span>
                    <button
                      onClick={handleRemoveAll}
                      className="px-3 py-1 text-xs font-bold text-white bg-expense rounded-lg border-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      Yes, remove
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs font-semibold text-text-muted bg-surface rounded-lg border border-border cursor-pointer hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete('all')}
                    className="w-full py-2 text-xs font-semibold text-expense border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    Remove all budgets for this category
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete category modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-surface rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Delete category</h3>
                <p className="text-xs text-text-muted mt-0.5">{deleteModal.cat.name}</p>
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-border text-text-muted border-0 cursor-pointer hover:text-text-primary transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-text-muted mb-3">
              Reassign existing transactions to another category (required if any exist):
            </p>

            <select
              value={deleteModal.reassignTo ?? ''}
              onChange={(e) =>
                setDeleteModal((prev) =>
                  prev
                    ? {
                        ...prev,
                        reassignTo: e.target.value ? Number(e.target.value) : null,
                        error: null,
                      }
                    : prev,
                )
              }
              className="w-full text-sm font-semibold text-text-primary bg-bg border border-border rounded-[11px] px-3 py-2.5 outline-none focus:border-accent mb-3 cursor-pointer"
            >
              <option value="">No reassignment (only if no transactions)</option>
              {categories
                .filter((c) => c.type === deleteModal.cat.type && c.id !== deleteModal.cat.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            {deleteModal.error && <p className="text-xs text-expense mb-3">{deleteModal.error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-[13px] bg-bg text-text-muted text-sm font-semibold border border-border cursor-pointer hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitCategoryDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-[13px] bg-expense text-white text-sm font-bold border-0 cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
