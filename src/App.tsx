import { useEffect, useState } from 'react';
import { seedDatabase } from './db';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { JournalEntry } from './pages/JournalEntry';
import { JournalList } from './pages/JournalList';
import { MasterAccounts } from './pages/MasterAccounts';
import { FinancialStatements } from './pages/FinancialStatements';
import { FixedAssets } from './pages/FixedAssets';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => setIsReady(true));
  }, []);

  if (!isReady) return <div className="flex items-center justify-center h-screen">Loading Database...</div>;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'journal-entry': return <JournalEntry />;
      case 'journal-list': return <JournalList />;
      case 'master-accounts': return <MasterAccounts />;
      case 'financial-statements': return <FinancialStatements />;
      case 'fixed-assets': return <FixedAssets />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPath={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
