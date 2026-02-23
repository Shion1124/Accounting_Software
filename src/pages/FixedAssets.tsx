import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Package, Trash2, Zap } from 'lucide-react';

export const FixedAssets = () => {
  const assets = useLiveQuery(() => db.fixedAssets.toArray());
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    usefulLife: 4,
    depreciationMethod: 'straight-line' as any
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.fixedAssets.add({
      id: crypto.randomUUID(),
      ...formData,
      isDisposed: false
    });
    setShowAdd(false);
  };

  const generateDepreciationEntry = async (asset: any) => {
    const amount = Math.floor(asset.acquisitionCost / asset.usefulLife);
    if (!confirm(`当期の減価償却費 ¥${amount.toLocaleString()} の仕訳を自動生成しますか？`)) return;

    const journalId = crypto.randomUUID();
    const deprAccount = await db.accounts.where('name').equals('減価償却費').first();
    const equipAccount = await db.accounts.where('name').equals('備品').first();

    if (!deprAccount || !equipAccount) return alert('「減価償却費」または「備品」科目がマスタに存在しません。');

    await db.transaction('rw', [db.journals, db.journalLines], async () => {
      await db.journals.add({
        id: journalId,
        date: new Date().toISOString().split('T')[0],
        description: `減価償却費計上: ${asset.name}`,
        createdAt: Date.now()
      });
      await db.journalLines.bulkAdd([
        { id: crypto.randomUUID(), journalId, accountId: deprAccount.id!, debit: amount, credit: 0 },
        { id: crypto.randomUUID(), journalId, accountId: equipAccount.id!, debit: 0, credit: amount }
      ]);
    });
    alert('仕訳を生成しました。');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">固定資産台帳</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          資産を登録
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border mb-8 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">資産名</label>
            <input required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">取得日</label>
            <input type="date" className="w-full border p-2 rounded" value={formData.acquisitionDate} onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">取得価額</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.acquisitionCost || ''} onChange={e => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">耐用年数 (年)</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.usefulLife || ''} onChange={e => setFormData({ ...formData, usefulLife: Number(e.target.value) })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-slate-800 text-white p-2 rounded-lg font-bold">保存</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4">資産名</th>
              <th className="px-6 py-4">取得日</th>
              <th className="px-6 py-4 text-right">取得価額</th>
              <th className="px-6 py-4 text-center">耐用年数</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets?.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-bold">{asset.name}</td>
                <td className="px-6 py-4 text-sm">{asset.acquisitionDate}</td>
                <td className="px-6 py-4 text-right font-mono">¥{asset.acquisitionCost.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-sm">{asset.usefulLife}年</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => generateDepreciationEntry(asset)}
                    className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 mx-auto hover:bg-amber-200 transition"
                  >
                    <Zap size={14} /> 償却仕訳
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
