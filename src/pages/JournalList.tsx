import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export const JournalList = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const accounts = useLiveQuery(() => db.accounts.where('isActive').equals(1).toArray());

  const journals = useLiveQuery(async () => {
    const js = await db.journals.orderBy('date').reverse().toArray();
    const lines = await db.journalLines.toArray();
    const acctsConfigs = await db.accounts.toArray();

    return js.map(j => ({
      ...j,
      lines: lines.filter(l => l.journalId === j.id).map(l => ({
        ...l,
        accountName: acctsConfigs.find(a => a.id === l.accountId)?.name || 'Unknown'
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

  const startEdit = (journal: any) => {
    setEditingId(journal.id);
    setEditData({
      date: journal.date,
      description: journal.description,
      lines: journal.lines.map((l: any) => ({
        id: l.id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        taxType: l.taxType || '対象外'
      }))
    });
  };

  const handleUpdate = async () => {
    const totalDebit = editData.lines.reduce((s: number, l: any) => s + l.debit, 0);
    const totalCredit = editData.lines.reduce((s: number, l: any) => s + l.credit, 0);

    if (totalDebit !== totalCredit || totalDebit === 0) {
      alert('貸借が一致していないか、金額が0です。');
      return;
    }

    await db.transaction('rw', [db.journals, db.journalLines], async () => {
      await db.journals.update(editingId!, {
        date: editData.date,
        description: editData.description
      });
      await db.journalLines.where('journalId').equals(editingId!).delete();
      await db.journalLines.bulkAdd(editData.lines.map((l: any) => ({
        ...l,
        journalId: editingId!,
        taxRate: l.taxType === '課税' ? 10 : 0 // Simplified: getting current rate or 0
      })));
    });

    setEditingId(null);
    setEditData(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仕訳一覧</h2>

      <div className="space-y-4">
        {journals?.map((journal) => (
          <div key={journal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              {editingId === journal.id ? (
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="date"
                    className="border p-1 rounded text-sm bg-white"
                    value={editData.date}
                    onChange={e => setEditData({ ...editData, date: e.target.value })}
                  />
                  <input
                    type="text"
                    className="border p-1 rounded text-sm flex-1 bg-white"
                    value={editData.description}
                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-700">{journal.date}</span>
                  <span className="text-sm text-gray-600">{journal.description}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === journal.id ? (
                  <>
                    <button onClick={handleUpdate} className="text-green-600 hover:text-green-700 p-1"><Check size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(journal)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="編集"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(journal.id!)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {editingId === journal.id ? (
                  editData.lines.map((line: any, idx: number) => (
                    <tr key={idx} className="border-b last:border-0 border-gray-50">
                      <td className="px-6 py-2 w-1/3">
                        <select
                          className="w-full border p-1 rounded text-xs bg-white"
                          value={line.accountId}
                          onChange={e => {
                            const newLines = [...editData.lines];
                            newLines[idx].accountId = e.target.value;
                            setEditData({ ...editData, lines: newLines });
                          }}
                        >
                          {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-2 w-1/6">
                        <select
                          className="w-full border p-1 rounded text-xs bg-white"
                          value={line.taxType}
                          onChange={e => {
                            const newLines = [...editData.lines];
                            newLines[idx].taxType = e.target.value;
                            setEditData({ ...editData, lines: newLines });
                          }}
                        >
                          <option value="課税">課税</option>
                          <option value="非課税">非課税</option>
                          <option value="対象外">対象外</option>
                        </select>
                      </td>
                      <td className="px-6 py-2 w-1/4">
                        <input
                          type="number"
                          className="w-full border p-1 rounded text-xs text-right bg-white"
                          value={line.debit || ''}
                          onChange={e => {
                            const newLines = [...editData.lines];
                            newLines[idx].debit = Number(e.target.value);
                            setEditData({ ...editData, lines: newLines });
                          }}
                        />
                      </td>
                      <td className="px-6 py-2 w-1/4">
                        <input
                          type="number"
                          className="w-full border p-1 rounded text-xs text-right bg-white"
                          value={line.credit || ''}
                          onChange={e => {
                            const newLines = [...editData.lines];
                            newLines[idx].credit = Number(e.target.value);
                            setEditData({ ...editData, lines: newLines });
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  journal.lines.map((line: any) => (
                    <tr key={line.id} className="border-b last:border-0 border-gray-50">
                      <td className="px-6 py-3 text-gray-700 w-1/3">
                        <div className="font-medium">{line.accountName}</div>
                        <div className="text-[10px] text-gray-400">{line.taxType || '対象外'}</div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono w-1/3">
                        {line.debit > 0 ? (
                          <div>
                            <div>¥{line.debit.toLocaleString()}</div>
                            {line.taxType === '課税' && (
                              <div className="text-[10px] text-gray-400 font-sans">
                                (内税 ¥{Math.round(line.debit * 10 / 110).toLocaleString()})
                              </div>
                            )}
                          </div>
                        ) : ''}
                      </td>
                      <td className="px-6 py-3 text-right font-mono w-1/3">
                        {line.credit > 0 ? (
                          <div>
                            <div>¥{line.credit.toLocaleString()}</div>
                            {line.taxType === '課税' && (
                              <div className="text-[10px] text-gray-400 font-sans">
                                (内税 ¥{Math.round(line.credit * 10 / 110).toLocaleString()})
                              </div>
                            )}
                          </div>
                        ) : ''}
                      </td>
                    </tr>
                  ))
                )}
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
