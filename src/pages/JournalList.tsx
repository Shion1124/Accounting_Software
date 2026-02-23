import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export const JournalList = () => {
  const journals = useLiveQuery(async () => {
    const js = await db.journals.orderBy('date').reverse().toArray();
    const lines = await db.journalLines.toArray();
    const accounts = await db.accounts.toArray();

    return js.map(j => ({
      ...j,
      lines: lines.filter(l => l.journalId === j.id).map(l => ({
        ...l,
        accountName: accounts.find(a => a.id === l.accountId)?.name || 'Unknown'
      }))
    }));
  });

  const handleDelete = async (id: string) => {
    if (!confirm('この仕訳を削除しますか？')) return;
    await db.transaction('rw', [db.journals, db.journalLines], async () => {
      await db.journals.delete(id);
      await db.journalLines.where('journalId').equals(id).delete();
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仕訳一覧</h2>

      <div className="space-y-4">
        {journals?.map((journal) => (
          <div key={journal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-700">{journal.date}</span>
                <span className="text-sm text-gray-600">{journal.description}</span>
              </div>
              <button
                onClick={() => handleDelete(journal.id!)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {journal.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0 border-gray-50">
                    <td className="px-6 py-3 text-gray-700 w-1/2">{line.accountName}</td>
                    <td className="px-6 py-3 text-right font-mono w-1/4">
                      {line.debit > 0 ? `¥${line.debit.toLocaleString()}` : ''}
                    </td>
                    <td className="px-6 py-3 text-right font-mono w-1/4">
                      {line.credit > 0 ? `¥${line.credit.toLocaleString()}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {journals?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400">登録された仕訳はありません</p>
          </div>
        )}
      </div>
    </div>
  );
};
