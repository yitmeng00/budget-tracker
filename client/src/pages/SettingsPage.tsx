import { useState } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import type { Category, UnitPosition, UserSettings, WeekDay } from '../types/index.ts';
import { MOCK_CATEGORIES } from '../lib/mockData.ts';

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

interface Props {
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

export default function SettingsPage({ settings, onUpdate }: Props) {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddType, setShowAddType] = useState<'income' | 'expense' | null>(null);
  const [newCat, setNewCat] = useState<NewCategoryForm>({ name: '', type: 'expense' });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, name: editName.trim() } : c)),
      );
    }
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
    const nextId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    const color = AUTO_COLORS[nextId % AUTO_COLORS.length];
    setCategories((prev) => [
      ...prev,
      { id: nextId, name: newCat.name.trim(), type: newCat.type, icon: 'tag', color },
    ]);
    closeAddForm();
  };

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
              {/* Section header */}
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

              {/* Category rows */}
              <div className="flex flex-col">
                {sectionCats.map((cat, i) => {
                  const isLast = i === sectionCats.length - 1 && !isAddingHere;
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
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Inline add form */}
                {isAddingHere && (
                  <div
                    className={[
                      'flex flex-col gap-3',
                      sectionCats.length > 0 ? 'mt-2 pt-3 border-t border-bg' : '',
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

                    {/* Form actions */}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
