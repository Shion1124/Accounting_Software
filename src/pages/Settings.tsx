import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Download, Upload, Building, User, MapPin, Hash, ClipboardList, Info, Calculator } from 'lucide-react';

export const Settings = () => {
  const [isExporting, setIsExporting] = useState(false);
  const settingsData = useLiveQuery(() => db.settings.toArray());
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settingsData) {
      const s = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      setForm(s);
    }
  }, [settingsData]);

  const handleUpdate = async (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    await db.settings.put({ key, value });
  };

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
    <div className="max-w-4xl mx-auto pb-20">
      <h2 className="text-2xl font-bold mb-8">設定・管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="font-bold mb-6 flex items-center gap-2"><Building size={20} className="text-blue-500" /> 基本情報（決算書類に反映されます）</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">会社名</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-white"
                value={form.companyName || ''}
                onChange={e => handleUpdate('companyName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><MapPin size={12} /> 住所</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-white"
                value={form.address || ''}
                onChange={e => handleUpdate('address', e.target.value)}
                placeholder="例：東京都港区..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><User size={12} /> 代表者氏名</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-white"
                value={form.representativeName || ''}
                onChange={e => handleUpdate('representativeName', e.target.value)}
                placeholder="例：代表取締役 常田 詩音"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Hash size={12} /> 期数</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded bg-white"
                  value={form.fiscalPeriod || ''}
                  onChange={e => handleUpdate('fiscalPeriod', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">年度開始日</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded bg-white"
                  value={form.fiscalYearStart || ''}
                  onChange={e => handleUpdate('fiscalYearStart', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">年度終了日</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded bg-white"
                  value={form.fiscalYearEnd || ''}
                  onChange={e => handleUpdate('fiscalYearEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Note Config */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-700"><ClipboardList size={20} /> 個別注記表の設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">消費税等の会計処理</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-white"
                value={form.taxMethod || ''}
                onChange={e => handleUpdate('taxMethod', e.target.value)}
                placeholder="例：税込方式"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">標準税率 (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded bg-white"
                value={form.taxRate || ''}
                onChange={e => handleUpdate('taxRate', e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">軽減税率 (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded bg-white"
                value={form.reducedTaxRate || ''}
                onChange={e => handleUpdate('reducedTaxRate', e.target.value)}
                placeholder="8"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">発行済株式総数</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-white"
                value={form.issuedShares || ''}
                onChange={e => handleUpdate('issuedShares', e.target.value)}
                placeholder="例：普通株式 100株"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">その他の注記</label>
              <textarea
                className="w-full border p-2 rounded bg-white h-24"
                value={form.otherNotes || ''}
                onChange={e => handleUpdate('otherNotes', e.target.value)}
                placeholder="特記事項なし"
              />
            </div>
          </div>
        </section>

        {/* Beginning Balance Config */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-emerald-600"><Calculator size={20} /> 株主資本等の期首残高（変動計算書の開始残高）</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">資本金 期首残高</label>
              <input
                type="number"
                className="w-full border p-2 rounded bg-white text-right font-mono"
                value={form.beginningCapital || '0'}
                onChange={e => handleUpdate('beginningCapital', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">利益剰余金 期首残高</label>
              <input
                type="number"
                className="w-full border p-2 rounded bg-white text-right font-mono"
                value={form.beginningRetainedEarnings || '0'}
                onChange={e => handleUpdate('beginningRetainedEarnings', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-600"><Download size={20} /> データ管理</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition"
            >
              <Download size={18} /> 書き出し
            </button>
            <label className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition cursor-pointer">
              <Upload size={18} /> 読み込み
              <input type="file" className="hidden" onChange={handleImport} accept=".json" />
            </label>
          </div>
        </section>

        <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <h3 className="font-bold mb-2 text-red-600 flex items-center gap-2"><Info size={20} /> 注意事項</h3>
          <ul className="text-sm text-red-700 space-y-2 list-disc pl-4">
            <li>設定を保存すると決算書類に即座に反映されます。</li>
            <li>データはブラウザ内にのみ保存されます。</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
