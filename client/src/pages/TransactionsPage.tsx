import { useState } from 'react';
import type { TxView, UserSettings } from '../types/index.ts';
import SummaryCards from '../components/transactions/SummaryCards.tsx';
import ViewSwitcher from '../components/transactions/ViewSwitcher.tsx';
import DailyView from '../components/transactions/DailyView.tsx';

interface Props {
  settings: UserSettings;
}

export default function TransactionsPage({ settings }: Props) {
  const [view, setView] = useState<TxView>('daily');

  return (
    <div>
      <SummaryCards income={5200} expenses={3860} settings={settings} />
      <ViewSwitcher active={view} onChange={setView} />

      {view === 'daily' && <DailyView settings={settings} />}
      {view === 'calendar' && <div className="text-text-subtle p-2">Calendar — In Progress</div>}
      {view === 'monthly' && <div className="text-text-subtle p-2">Monthly — In Progress</div>}
    </div>
  );
}
