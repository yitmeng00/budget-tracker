import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import TransactionsPage from './pages/TransactionsPage.tsx';
import StatsPage from './pages/StatsPage.tsx';
import AccountsPage from './pages/AccountsPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import type { Tab } from './types/index.ts';
import { useSettings } from './hooks/useSettings.ts';
import { useMonth } from './hooks/useMonth.ts';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});

function AppShell() {
  const [tab, setTab] = useState<Tab>('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const { settings } = useSettings();
  const { label: monthLabel, prev, next } = useMonth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text-primary">
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        settings={settings}
        budgetSpent={3860}
        budgetTotal={5200}
      />

      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          tab={tab}
          monthLabel={monthLabel}
          onPrevMonth={prev}
          onNextMonth={next}
          onAddTransaction={() => setShowAddModal(true)}
        />

        <div className="flex-1 overflow-auto px-[34px] pt-[10px] pb-[44px]">
          {tab === 'transactions' && <TransactionsPage settings={settings} />}
          {tab === 'stats' && <StatsPage />}
          {tab === 'accounts' && <AccountsPage />}
          {tab === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* Add transaction modal — implemented in PR 10 */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 bg-[rgba(31,27,46,0.4)] flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl p-8 min-w-100"
          >
            <p className="text-base font-bold mb-2">Add Transaction</p>
            <p className="text-text-subtle text-sm">In Progress</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 px-5 py-2.5 rounded-xl border-0 bg-accent text-white cursor-pointer font-bold"
            >
              Close
            </button>
          </div>
        </div>
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
