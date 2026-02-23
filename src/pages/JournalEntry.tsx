import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Save } from 'lucide-react';

interface Row {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
}

export const JournalEntry = () => {
  const accounts = useLiveQuery(() => db.accounts.where('isActive').equals(1).toArray());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 },
    { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 },
  ]);

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof Row, value: string | number) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return alert('貸借が一致していません。');

    const journalId = crypto.randomUUID();
    await db.transaction('rw', [db.journals, db.journalLines], async () => {
      await db.journals.add({
        id: journalId,
        date,
        description,
        createdAt: Date.now()
      });

      const lines = rows.map(r => ({
        id: crypto.randomUUID(),
        journalId,
        accountId: r.accountId,
        debit: r.debit,
        credit: r.credit
      }));

      await db.journalLines.bulkAdd(lines);
    });

    // Reset
    setDescription('');
    setRows([
      { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 },
      { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 },
    ]);
    alert('仕訳を登録しました。');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">仕訳入力</h2>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">日付</label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg p-3 outline-blue-500"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">摘要</label>
            <input
              type="text"
              placeholder="例：オフィス家賃 1月分"
              required
              className="w-full border border-gray-300 rounded-lg p-3 outline-blue-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 px-2">勘定科目</th>
              <th className="pb-3 px-2 w-32">借方金額</th>
              <th className="pb-3 px-2 w-32">貸方金額</th>
              <th className="pb-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 px-2">
                  <select
                    required
                    className="w-full border border-gray-200 rounded p-2 text-sm bg-gray-50 cursor-pointer"
                    value={row.accountId}
                    onChange={e => updateRow(row.id, 'accountId', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {accounts?.map(acct => (
                      <option key={acct.id} value={acct.id}>{acct.code} : {acct.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded p-2 text-sm text-right font-mono"
                    value={row.debit || ''}
                    onChange={e => updateRow(row.id, 'debit', Number(e.target.value))}
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded p-2 text-sm text-right font-mono"
                    value={row.credit || ''}
                    onChange={e => updateRow(row.id, 'credit', Number(e.target.value))}
                  />
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-8 border border-dashed border-gray-200">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700"
          >
            <Plus size={16} /> 行を追加
          </button>

          <div className="flex gap-8 text-sm font-bold">
            <div className={totalDebit !== totalCredit ? 'text-red-500' : 'text-gray-700'}>
              借方計: <span className="font-mono ml-2">¥{totalDebit.toLocaleString()}</span>
            </div>
            <div className={totalDebit !== totalCredit ? 'text-red-500' : 'text-gray-700'}>
              貸方計: <span className="font-mono ml-2">¥{totalCredit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isBalanced}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${isBalanced
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          <Save size={20} /> 仕訳を保存する
        </button>
      </form>
    </div>
  );
};
