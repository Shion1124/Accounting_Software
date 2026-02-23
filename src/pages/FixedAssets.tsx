import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Package, Trash2, Zap, Edit2, X } from 'lucide-react';

export const FixedAssets = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    usefulLife: 4,
    depreciationMethod: 'straight-line' as any
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.fixedAssets.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.fixedAssets.add({
        id: crypto.randomUUID(),
        ...formData,
        isDisposed: false
      });
    }
    setShowAdd(false);
    setFormData({
      name: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: 0,
      usefulLife: 4,
      depreciationMethod: 'straight-line'
    });
  };

  const handleEdit = (asset: any) => {
    setFormData({
      name: asset.name,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      usefulLife: asset.usefulLife,
      depreciationMethod: asset.depreciationMethod
    });
    setEditingId(asset.id);
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({
      name: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: 0,
      usefulLife: 4,
      depreciationMethod: 'straight-line'
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`固定資産「${name}」を台帳から削除してもよろしいですか？\n※この操作により「過去の減価償却仕訳」が削除されることはありません。`)) {
      await db.fixedAssets.delete(id);
    }
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

  const assets = useLiveQuery(() => db.fixedAssets.toArray());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">固定資産台帳</h2>
        <button
          onClick={() => showAdd ? handleCancel() : setShowAdd(true)}
          className={`${showAdd ? 'bg-gray-500' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg transition`}
        >
          {showAdd ? 'キャンセル' : '資産を登録'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border mb-8 grid grid-cols-2 gap-4 shadow-sm">
          <div className="col-span-2 flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-700">{editingId ? '資産の編集' : '新規資産登録'}</h3>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">資産名</label>
            <input required className="w-full border p-2 rounded bg-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">取得日</label>
            <input type="date" className="w-full border p-2 rounded bg-white" value={formData.acquisitionDate} onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">取得価額</label>
            <input type="number" className="w-full border p-2 rounded bg-white" value={formData.acquisitionCost || ''} onChange={e => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">耐用年数 (年)</label>
            <input type="number" className="w-full border p-2 rounded bg-white" value={formData.usefulLife || ''} onChange={e => setFormData({ ...formData, usefulLife: Number(e.target.value) })} />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-slate-800 text-white p-2 rounded-lg font-bold hover:bg-slate-700 transition">
              {editingId ? '更新する' : '保存する'}
            </button>
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
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => generateDepreciationEntry(asset)}
                      className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-amber-200 transition"
                    >
                      <Zap size={14} /> 償却仕訳
                    </button>
                    <button
                      onClick={() => handleEdit(asset)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="編集"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id!, asset.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
