import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  PenLine,
  FileText,
  BookOpen,
  Calculator,
  Settings as SettingsIcon,
  Package
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const menuItems = [
    { label: 'ダッシュボード', path: 'dashboard', icon: LayoutDashboard },
    { label: '仕訳入力', path: 'journal-entry', icon: PenLine },
    { label: '仕訳一覧', path: 'journal-list', icon: FileText },
    { label: '決算・帳票', path: 'financial-statements', icon: Calculator },
    { label: '固定資産', path: 'fixed-assets', icon: Package },
    { label: '勘定科目', path: 'master-accounts', icon: BookOpen },
    { label: '設定・管理', path: 'settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar - Hidden in Print */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider">Shion会計</h1>
          <p className="text-xs text-slate-400 mt-1">1人会社版 (免税)</p>
        </div>
        <nav className="mt-4 px-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors mb-1 ${currentPath === item.path
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
