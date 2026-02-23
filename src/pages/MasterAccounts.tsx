import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const MasterAccounts = () => {
  const accounts = useLiveQuery(() => db.accounts.orderBy('code').toArray());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'asset' as any });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.accounts.add({
      id: crypto.randomUUID(),
      ...formData,
      isActive: true
    });
    setFormData({ code: '', name: '', type: 'asset' });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">勘定科目マスタ</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          {isEditing ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">コード</label>
            <input
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="flex-2">
            <label className="block text-sm font-medium text-gray-700">科目名</label>
            <input
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">タイプ</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="asset">資産</option>
              <option value="liability">負債</option>
              <option value="equity">純資産</option>
              <option value="revenue">収益</option>
              <option value="expense">費用</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 h-10">
            登録
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">コード</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">科目名</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">区分</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {accounts?.map(acct => (
              <tr key={acct.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono">{acct.code}</td>
                <td className="px-6 py-4 font-medium">{acct.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{acct.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${acct.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {acct.isActive ? '有効' : '無効'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
