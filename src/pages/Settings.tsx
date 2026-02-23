import React, { useState } from 'react';
import { db } from '../db';
import { Download, Upload, AlertTriangle, Calendar, Building } from 'lucide-react';

export const Settings = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = {
        accounts: await db.accounts.toArray(),
        journals: await db.journals.toArray(),
        journalLines: await db.journalLines.toArray(),
        fixedAssets: await db.fixedAssets.toArray(),
        settings: await db.settings.toArray(),
        version: 1,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('既存のデータがすべて上書きされます。よろしいですか？')) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        await db.transaction('rw', [db.accounts, db.journals, db.journalLines, db.fixedAssets, db.settings], async () => {
          await db.accounts.clear();
          await db.journals.clear();
          await db.journalLines.clear();
          await db.fixedAssets.clear();
          await db.settings.clear();

          await db.accounts.bulkAdd(data.accounts);
          await db.journals.bulkAdd(data.journals);
          await db.journalLines.bulkAdd(data.journalLines);
          await db.fixedAssets.bulkAdd(data.fixedAssets);
          await db.settings.bulkAdd(data.settings);
        });
        alert('データを復元しました。');
        window.location.reload();
      } catch (err) {
        alert('エラーが発生しました：' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">設定・管理</h2>

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Building size={20} className="text-gray-400" /> 基本情報</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">会社名</label>
              <input type="text" className="w-full border p-2 rounded" defaultValue="サンプル株式会社" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">年度開始日</label>
              <input type="date" className="w-full border p-2 rounded" defaultValue="2025-01-01" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-600"><Download size={20} /> バックアップと復元</h3>
          <p className="text-sm text-gray-500 mb-6">すべてのデータをJSON形式で保存します。万一のデータ消失に備え、定期的なバックアップを推奨します。</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition"
            >
              <Download size={18} /> エクスポート
            </button>
            <label className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition cursor-pointer">
              <Upload size={18} /> インポート
              <input type="file" className="hidden" onChange={handleImport} accept=".json" />
            </label>
          </div>
        </section>

        <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <h3 className="font-bold mb-2 text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> 注意事項</h3>
          <ul className="text-sm text-red-700 space-y-2 list-disc pl-4">
            <li>データはブラウザのローカル（IndexedDB）にのみ保存されます。ブラウザのキャッシュをクリアするとデータが消える可能性があります。</li>
            <li>1人会社・免税事業者向けに設計されているため、消費税の自動計算機能はありません。</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
