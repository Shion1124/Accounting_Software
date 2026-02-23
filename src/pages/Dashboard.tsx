import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';

export const Dashboard = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const stats = useLiveQuery(async () => {
    const lines = await db.journalLines.toArray();
    const accounts = await db.accounts.toArray();

    const revenues = lines
      .filter(l => accounts.find(a => a.id === l.accountId)?.type === 'revenue')
      .reduce((sum, l) => sum + l.credit - l.debit, 0);

    const expenses = lines
      .filter(l => accounts.find(a => a.id === l.accountId)?.type === 'expense')
      .reduce((sum, l) => sum + l.debit - l.credit, 0);

    const assets = lines
      .filter(l => accounts.find(a => a.id === l.accountId)?.type === 'asset')
      .reduce((sum, l) => sum + l.debit - l.credit, 0);

    const liabilities = lines
      .filter(l => accounts.find(a => a.id === l.accountId)?.type === 'liability')
      .reduce((sum, l) => sum + l.credit - l.debit, 0);

    return { revenues, expenses, assets, liabilities, netIncome: revenues - expenses };
  });

  if (!stats) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">ダッシュボード</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">累計売上</p>
          <h3 className="text-2xl font-bold mt-1">¥{stats.revenues.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4">
            <TrendingDown size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">累計費用</p>
          <h3 className="text-2xl font-bold mt-1">¥{stats.expenses.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">当期純利益</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¥{stats.netIncome.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">純資産合計</p>
          <h3 className="text-2xl font-bold mt-1">¥{(stats.assets - stats.liabilities).toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />収支バランス
          </h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">収益</span>
                <span className="font-mono">¥{stats.revenues.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.revenues > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">費用</span>
                <span className="font-mono">¥{stats.expenses.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-red-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.revenues > 0 ? (stats.expenses / stats.revenues) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white flex flex-col justify-center">
          <h4 className="text-slate-400 text-sm font-bold mb-2 uppercase tracking-widest">Quick Start</h4>
          <h3 className="text-2xl font-bold mb-6">決算の準備はできていますか？</h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            すべての仕訳を入力したら、「決算・帳票」タブからPDFを出力して税理士へ送信しましょう。1人会社向けのシンプルなフローを提供します。
          </p>
          <button
            onClick={() => onNavigate('financial-statements')}
            className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all transform active:scale-95"
          >
            帳票を確認する
          </button>
        </div>
      </div>
    </div>
  );
};

