import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Save } from 'lucide-react';

interface Row {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  taxType: '課税' | '非課税' | '対象外';
  taxRate: number;
}

export const JournalEntry = () => {
  const accounts = useLiveQuery(() => db.accounts.filter(a => a.isActive).toArray());
  const taxSettings = useLiveQuery(async () => {
    const rate = await db.settings.get('taxRate');
    const reducedRate = await db.settings.get('reducedTaxRate');
    return {
      standard: Number(rate?.value || 10),
      reduced: Number(reducedRate?.value || 8)
    };
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, taxType: '課税', taxRate: 10 },
    { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, taxType: '対象外', taxRate: 0 },
  ]);

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const allRowsHaveAccount = rows.every(r => r.accountId !== '');
  const isBalanced = totalDebit === totalCredit && totalDebit > 0 && allRowsHaveAccount;

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, taxType: '課税', taxRate: 10 }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, updates: Partial<Row>) => {
    setRows(prevRows => prevRows.map(r => r.id === id ? { ...r, ...updates } : r));
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
        credit: r.credit,
        taxType: r.taxType,
        taxRate: r.taxType === '課税' ? r.taxRate : 0
      }));

      await db.journalLines.bulkAdd(lines);
    });

    // Reset
    setDescription('');
    setRows([
      { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, taxType: '課税', taxRate: 10 },
      { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, taxType: '対象外', taxRate: 0 },
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
              className="w-full border border-gray-300 rounded-lg p-3 outline-blue-500 bg-white"
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
              className="w-full border border-gray-300 rounded-lg p-3 outline-blue-500 bg-white"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 px-2">勘定科目</th>
              <th className="pb-3 px-2 w-24">税区分</th>
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
                    className="w-full border border-gray-200 rounded p-2 text-sm bg-white cursor-pointer"
                    value={row.accountId}
                    onChange={e => updateRow(row.id, { accountId: e.target.value })}
                  >
                    <option value="">選択してください</option>
                    {accounts?.map(acct => (
                      <option key={acct.id} value={acct.id}>{acct.code} : {acct.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-col gap-1">
                    <select
                      className="w-full border border-gray-200 rounded p-2 text-xs bg-white"
                      value={row.taxType}
                      onChange={e => {
                        const newType = e.target.value as any;
                        const updates: Partial<Row> = { taxType: newType };
                        if (newType === '課税') updates.taxRate = taxSettings?.standard || 10;
                        else updates.taxRate = 0;
                        updateRow(row.id, updates);
                      }}
                    >
                      <option value="課税">課税</option>
                      <option value="非課税">非課税</option>
                      <option value="対象外">対象外</option>
                    </select>
                    {row.taxType === '課税' && (
                      <select
                        className="w-full border border-gray-200 rounded p-1 text-[10px] bg-blue-50 text-blue-700 font-bold"
                        value={row.taxRate}
                        onChange={e => updateRow(row.id, { taxRate: Number(e.target.value) })}
                      >
                        <option value={taxSettings?.standard || 10}>{taxSettings?.standard || 10}% 標準</option>
                        <option value={taxSettings?.reduced || 8}>{taxSettings?.reduced || 8}% 軽減</option>
                      </select>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 group relative">
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded p-2 text-sm text-right font-mono bg-white"
                    value={row.debit || ''}
                    onChange={e => updateRow(row.id, { debit: Number(e.target.value) })}
                  />
                  {row.taxType === '課税' && row.debit > 0 && (
                    <div className="absolute -bottom-1 right-2 text-[10px] text-gray-400">
                      (内税込 {Math.round(row.debit * row.taxRate / (100 + row.taxRate)).toLocaleString()}円)
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 group relative">
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded p-2 text-sm text-right font-mono bg-white"
                    value={row.credit || ''}
                    onChange={e => updateRow(row.id, { credit: Number(e.target.value) })}
                  />
                  {row.taxType === '課税' && row.credit > 0 && (
                    <div className="absolute -bottom-1 right-2 text-[10px] text-gray-400">
                      (内税込 {Math.round(row.credit * row.taxRate / (100 + row.taxRate)).toLocaleString()}円)
                    </div>
                  )}
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

        <div className="mb-4">
          {!allRowsHaveAccount && totalDebit > 0 && (
            <p className="text-red-500 text-xs font-bold text-center mb-2">※すべての行で勘定科目を選択してください</p>
          )}
          {allRowsHaveAccount && totalDebit !== totalCredit && totalDebit > 0 && (
            <p className="text-red-500 text-xs font-bold text-center mb-2">※借方と貸方の合計が一致していません</p>
          )}
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
