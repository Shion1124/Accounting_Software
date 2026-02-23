import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Printer } from 'lucide-react';

type StatementType = 'TB' | 'BS' | 'PL';

export const FinancialStatements = () => {
  const [type, setType] = useState<StatementType>('TB');

  const data = useLiveQuery(async () => {
    const accounts = await db.accounts.orderBy('code').toArray();
    const lines = await db.journalLines.toArray();

    const results = accounts.map(acct => {
      const acctLines = lines.filter(l => l.accountId === acct.id);
      const debitTotal = acctLines.reduce((sum, l) => sum + l.debit, 0);
      const creditTotal = acctLines.reduce((sum, l) => sum + l.credit, 0);

      // Calculate balance based on account type
      let balance = 0;
      if (acct.type === 'asset' || acct.type === 'expense') {
        balance = debitTotal - creditTotal;
      } else {
        balance = creditTotal - debitTotal;
      }

      return {
        ...acct,
        debitTotal,
        creditTotal,
        balance
      };
    });

    const netIncome = results
      .filter(r => r.type === 'revenue' || r.type === 'expense')
      .reduce((sum, r) => {
        return r.type === 'revenue' ? sum + r.balance : sum - r.balance;
      }, 0);

    return { results, netIncome };
  }, [type]);

  if (!data) return null;

  const { results, netIncome } = data;

  const renderTB = () => (
    <table className="w-full bg-white border border-gray-200">
      <thead className="bg-gray-100 font-bold border-b border-gray-200">
        <tr>
          <th className="px-4 py-2 text-left">勘定科目</th>
          <th className="px-4 py-2 text-right">借方合計</th>
          <th className="px-4 py-2 text-right">貸方合計</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {results.map(r => (
          <tr key={r.id}>
            <td className="px-4 py-2">{r.name}</td>
            <td className="px-4 py-2 text-right font-mono">{r.debitTotal > 0 ? r.debitTotal.toLocaleString() : '-'}</td>
            <td className="px-4 py-2 text-right font-mono">{r.creditTotal > 0 ? r.creditTotal.toLocaleString() : '-'}</td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
          <td className="px-4 py-2">合計</td>
          <td className="px-4 py-2 text-right font-mono">{results.reduce((s, r) => s + r.debitTotal, 0).toLocaleString()}</td>
          <td className="px-4 py-2 text-right font-mono">{results.reduce((s, r) => s + r.creditTotal, 0).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPL = () => {
    const revenues = results.filter(r => r.type === 'revenue');
    const expenses = results.filter(r => r.type === 'expense');
    return (
      <div className="bg-white p-8 border border-gray-200 shadow-sm max-w-2xl mx-auto print:shadow-none print:border-none">
        <h3 className="text-xl font-bold text-center mb-8">損益計算書</h3>
        <div className="space-y-4">
          <div className="border-b-2 border-gray-800 pb-2 font-bold flex justify-between">
            <span>収益</span>
            <span>金額</span>
          </div>
          {revenues.map(r => (
            <div key={r.id} className="flex justify-between pl-4">
              <span>{r.name}</span>
              <span className="font-mono">{r.balance.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
            <span>収益合計</span>
            <span>{revenues.reduce((s, r) => s + r.balance, 0).toLocaleString()}</span>
          </div>

          <div className="border-b-2 border-gray-800 pb-2 mt-8 font-bold flex justify-between">
            <span>費用</span>
            <span>金額</span>
          </div>
          {expenses.map(r => (
            <div key={r.id} className="flex justify-between pl-4">
              <span>{r.name}</span>
              <span className="font-mono">{r.balance.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
            <span>費用合計</span>
            <span>{expenses.reduce((s, r) => s + r.balance, 0).toLocaleString()}</span>
          </div>

          <div className="mt-8 pt-4 border-t-2 border-double border-gray-800 flex justify-between font-bold text-lg bg-blue-50 p-2">
            <span>当期純利益</span>
            <span>{netIncome.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBS = () => {
    const assets = results.filter(r => r.type === 'asset');
    const liabilities = results.filter(r => r.type === 'liability');
    const equity = results.filter(r => r.type === 'equity');
    return (
      <div className="bg-white p-8 border border-gray-200 shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none">
        <h3 className="text-xl font-bold text-center mb-8">貸借対照表</h3>
        <div className="grid grid-cols-2 gap-0 border-2 border-gray-800">
          {/* Left Side: Assets */}
          <div className="border-r-2 border-gray-800">
            <div className="bg-gray-100 p-2 font-bold text-center border-b-2 border-gray-800">資産の部</div>
            <div className="p-4 space-y-2 min-h-[400px]">
              {assets.map(r => (
                <div key={r.id} className="flex justify-between">
                  <span>{r.name}</span>
                  <span className="font-mono">{r.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-2 font-bold border-t-2 border-gray-800 flex justify-between">
              <span>資産合計</span>
              <span>{assets.reduce((s, r) => s + r.balance, 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Right Side: Liabilities & Equity */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="bg-gray-100 p-2 font-bold text-center border-b-2 border-gray-800">負債の部</div>
              <div className="p-4 space-y-2 h-[150px]">
                {liabilities.map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="font-mono">{r.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-2 font-bold border-t border-b-2 border-gray-800 flex justify-between">
                <span>負債合計</span>
                <span>{liabilities.reduce((s, r) => s + r.balance, 0).toLocaleString()}</span>
              </div>

              <div className="bg-gray-100 p-2 font-bold text-center border-b-2 border-gray-800">純資産の部</div>
              <div className="p-4 space-y-2 h-[150px]">
                {equity.map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="font-mono">{r.balance.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between italic text-blue-700">
                  <span>当期純利益</span>
                  <span className="font-mono">{netIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-2 font-bold border-t-2 border-gray-800 flex justify-between">
              <span>負債純資産合計</span>
              <span>{(liabilities.reduce((s, r) => s + r.balance, 0) + equity.reduce((s, r) => s + r.balance, 0) + netIncome).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md transition ${type === 'TB' ? 'bg-white shadow-sm font-bold' : 'hover:bg-gray-300'}`}
            onClick={() => setType('TB')}
          >試算表</button>
          <button
            className={`px-4 py-2 rounded-md transition ${type === 'PL' ? 'bg-white shadow-sm font-bold' : 'hover:bg-gray-300'}`}
            onClick={() => setType('PL')}
          >損益計算書 (PL)</button>
          <button
            className={`px-4 py-2 rounded-md transition ${type === 'BS' ? 'bg-white shadow-sm font-bold' : 'hover:bg-gray-300'}`}
            onClick={() => setType('BS')}
          >貸借対照表 (BS)</button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition shadow"
        >
          <Printer size={18} /> 印刷 / PDF
        </button>
      </div>

      <div className="print:m-0">
        {type === 'TB' && renderTB()}
        {type === 'PL' && renderPL()}
        {type === 'BS' && renderBS()}
      </div>
    </div>
  );
};
