import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import TransactionsPage from './pages/TransactionsPage.tsx';
import StatsPage from './pages/StatsPage.tsx';
import AccountsPage from './pages/AccountsPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import AddTransactionModal from './components/transactions/AddTransactionModal.tsx';
import type { Tab } from './types/index.ts';
import { useSettings } from './hooks/useSettings.ts';
import { useMonth } from './hooks/useMonth.ts';
import { fetchTransactions, fetchBudgets } from './lib/api.ts';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});

function AppShell() {
  const [tab, setTab] = useState<Tab>('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const { settings, update } = useSettings();
  const { year, month, label: monthLabel, prev, next } = useMonth();

  // Same query keys as TransactionsPage/MonthlyView — React Query serves cached data.
  const { data: txs = [] } = useQuery({
    queryKey: ['transactions', year, month],
    queryFn: () => fetchTransactions(year, month),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', year, month + 1],
    queryFn: () => fetchBudgets(year, month + 1),
  });

  // Only include categories that have a budget set for this month.
  // Categories without limits are excluded from both spent and total.
  const budgetedEntries = budgets.filter((b) => (b.override_amount ?? b.default_amount) !== null);
  const budgetTotal = budgetedEntries.reduce(
    (s, b) => s + (b.override_amount ?? b.default_amount)!,
    0,
  );
  const budgetedIds = new Set(budgetedEntries.map((b) => b.category_id));
  const budgetSpent = txs
    .filter((tx) => tx.amount < 0 && budgetedIds.has(tx.category_id))
    .reduce((s, tx) => s + Math.abs(tx.amount), 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text-primary">
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        settings={settings}
        year={year}
        month={month}
        budgetSpent={budgetSpent}
        budgetTotal={budgetTotal}
      />

      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          tab={tab}
          monthLabel={monthLabel}
          onPrevMonth={prev}
          onNextMonth={next}
          onAddTransaction={() => setShowAddModal(true)}
        />

        <div className="flex-1 overflow-auto px-8.5 pt-2.5 pb-11">
          {tab === 'transactions' && (
            <TransactionsPage year={year} month={month} settings={settings} />
          )}
          {tab === 'stats' && <StatsPage year={year} month={month} settings={settings} />}
          {tab === 'accounts' && <AccountsPage settings={settings} />}
          {tab === 'settings' && (
            <SettingsPage year={year} month={month} settings={settings} onUpdate={update} />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddTransactionModal onClose={() => setShowAddModal(false)} settings={settings} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
