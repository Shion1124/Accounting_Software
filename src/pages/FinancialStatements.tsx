import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Printer } from 'lucide-react';

type StatementType = 'TB' | 'BS' | 'PL' | 'REPORT';

export const FinancialStatements = () => {
  const [type, setType] = useState<StatementType>('TB');

  const data = useLiveQuery(async () => {
    const accounts = await db.accounts.orderBy('code').toArray();
    const lines = await db.journalLines.toArray();
    const s = await db.settings.toArray();
    const settings = s.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);

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

    return { results, netIncome, settings };
  }, [type]);

  if (!data) return null;

  const { results, netIncome, settings } = data;

  const formatJPY = (num: number) => {
    const formatted = Math.abs(num).toLocaleString();
    return (
      <span className="font-mono tabular-nums inline-block text-right min-w-[80px]">
        {num < 0 ? `△${formatted}` : (num === 0 ? '0' : formatted)}
      </span>
    );
  };

  const formatDateJP = (dateStr: string | undefined, includeDay = true) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear() - 2018; // Reiwa
    const renderNum = (n: number | string) => <span className="font-mono tabular-nums">{n}</span>;
    if (includeDay) {
      return <>令和{renderNum(year)}年 {renderNum(d.getMonth() + 1)}月 {renderNum(d.getDate())}日</>;
    }
    return <>令和{renderNum(year)}年 {renderNum(d.getMonth() + 1)}月</>;
  };

  const renderCover = () => {

    return (
      <div className="bg-white border border-gray-100 font-serif text-slate-900 report-page report-page-1 flex flex-col justify-center items-center">
        <div className="text-center">
          <h1
            className="text-4xl font-bold mb-4 border-b-2 border-slate-900 pb-3 inline-block px-12"
            style={{ letterSpacing: '0.5em' }}
          >決算報告書</h1>
          <p className="text-xl mt-3">（第 <span className="font-mono tabular-nums">{settings.fiscalPeriod || '—'}</span> 期）</p>
        </div>

        <div className="mt-16 text-center space-y-10">
          <div className="inline-block text-left text-lg space-y-2 border-y border-slate-200 py-4 px-10">
            <div className="flex gap-8 items-center">
              <span className="text-sm text-slate-500 w-4">自</span>
              <span>{formatDateJP(settings.fiscalYearStart)}</span>
            </div>
            <div className="flex gap-8 items-center">
              <span className="text-sm text-slate-500 w-4">至</span>
              <span>{formatDateJP(settings.fiscalYearEnd || settings.fiscalYearStart)}</span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-3 tracking-widest whitespace-nowrap">{settings.companyName}</h2>
              <div className="w-16 h-px bg-slate-900 mx-auto mb-4"></div>
              <p className="text-sm text-slate-700 mb-3">{settings.address}</p>
              <p className="text-xl font-semibold">{settings.representativeName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEquity = () => {
    const begCap = Number(settings.beginningCapital || 0);
    const begRE = Number(settings.beginningRetainedEarnings || 0);

    const curCap = results.find(r => r.code === '300')?.balance || 0;
    const curRE = results.find(r => r.code === '310')?.balance || 0;

    const capMovement = curCap - begCap;
    const reMovement = (curRE - begRE) + netIncome;

    return (
      <div className="bg-white border border-gray-200 font-serif text-[11px] leading-normal report-page report-page-4">
        <h3 className="text-xl font-bold text-center mb-6 underline underline-offset-4 tracking-[0.3rem]">株主資本等変動計算書</h3>
        <p className="text-xs text-right mb-2 text-slate-600">（単位：円）</p>
        <table className="w-full border-collapse border border-gray-700 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border border-gray-700 p-1">項目</th>
              <th colSpan={3} className="border border-gray-700 p-1 text-center">株主資本</th>
              <th rowSpan={2} className="border border-gray-700 p-1">純資産合計</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-700 p-1">資本金</th>
              <th className="border border-gray-700 p-1">利益剰余金</th>
              <th className="border border-gray-700 p-1 text-center">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-700 p-2">当期首残高</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{begCap.toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{begRE.toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(begCap + begRE).toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(begCap + begRE).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-700 p-2">当期変動額</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{capMovement === 0 ? '-' : capMovement.toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{reMovement.toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(capMovement + reMovement).toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(capMovement + reMovement).toLocaleString()}</td>
            </tr>
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-700 p-2">当期末残高</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{curCap.toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(curRE + netIncome).toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(curCap + curRE + netIncome).toLocaleString()}</td>
              <td className="border border-gray-700 p-2 text-right font-mono text-[10px]">{(curCap + curRE + netIncome).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderOfficialBS = () => {
    const assets = results.filter(r => r.type === 'asset');
    const liabilities = results.filter(r => r.type === 'liability');
    const equity = results.filter(r => r.type === 'equity');

    const currentAssetsList = assets.filter(r => r.code < '150');
    const cashAndDeposits = currentAssetsList.filter(r => r.code.startsWith('10'));
    const otherCurrentAssets = currentAssetsList.filter(r => !r.code.startsWith('10'));

    const fixedAssets = assets.filter(r => r.code >= '150' && r.code < '190');
    const deferredAssets = assets.filter(r => r.code >= '190');

    const renderAccountRow = (name: string, balance: number, indent = false) => (
      <tr key={name} className="text-[10px]">
        <td className={`border-r border-slate-400 p-1 ${indent ? 'pl-4' : ''}`}>{name}</td>
        <td className="p-1 text-right align-middle text-[11px]">{formatJPY(balance)}</td>
      </tr>
    );

    return (
      <div className="bg-white border border-gray-200 font-serif text-sm leading-normal report-page report-page-2">
        <h3 className="text-2xl font-bold text-center mb-2 underline underline-offset-4 tracking-[0.5rem]">貸 借 対 照 表</h3>
        <p className="text-center mb-4 text-slate-600 text-xs">{formatDateJP(settings.fiscalYearEnd || settings.fiscalYearStart)} 現在</p>

        <div className="flex justify-between mb-2 text-slate-700 text-xs">
          <span>{settings.companyName}</span>
          <span>（単位：円）</span>
        </div>

        <table className="w-full border-2 border-slate-900 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th colSpan={2} className="border-r-2 border-slate-900 p-1 w-1/2 text-sm">資 産 の 部</th>
              <th colSpan={2} className="p-1 w-1/2 text-sm">負 債 の 部</th>
            </tr>
            <tr className="border-b border-slate-400 bg-slate-50 text-[10px] font-bold uppercase tracking-wider">
              <th className="border-r border-slate-400 p-1">科目</th>
              <th className="border-r-2 border-slate-900 p-1">金額</th>
              <th className="border-r border-slate-400 p-1">科目</th>
              <th className="p-1">金額</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr>
              <td colSpan={2} className="border-r-2 border-slate-900 p-0">
                <table className="w-full">
                  <tbody className="text-[10px]">
                    <tr><td className="p-1 font-bold">I 流動資産</td><td className="p-1 text-right font-bold text-[11px]">{formatJPY(currentAssetsList.reduce((s, r) => s + r.balance, 0))}</td></tr>
                    {cashAndDeposits.length > 0 && renderAccountRow("現金及び預金", cashAndDeposits.reduce((s, r) => s + r.balance, 0), true)}
                    {otherCurrentAssets.map(r => renderAccountRow(r.name, r.balance, true))}

                    <tr><td className="p-1 font-bold pt-2">II 固定資産</td><td className="p-1 text-right font-bold pt-2 text-[11px]">{formatJPY(fixedAssets.reduce((s, r) => s + r.balance, 0))}</td></tr>
                    {fixedAssets.length > 0 && (
                      <>
                        <tr><td className="p-1 pl-4 text-[10px]">(有形固定資産)</td><td className="p-1"></td></tr>
                        {fixedAssets.map(r => renderAccountRow(r.name, r.balance, true))}
                      </>
                    )}

                    {deferredAssets.length > 0 && (
                      <>
                        <tr><td className="p-1 font-bold pt-2">III 繰延資産</td><td className="p-1 text-right font-bold pt-2 text-[11px]">{formatJPY(deferredAssets.reduce((s, r) => s + r.balance, 0))}</td></tr>
                        {deferredAssets.map(r => renderAccountRow(r.name, r.balance, true))}
                      </>
                    )}
                  </tbody>
                </table>
              </td>
              <td colSpan={2} className="p-0">
                <table className="w-full">
                  <tbody className="text-[10px]">
                    <tr><td className="p-1 font-bold">I 流動負債</td><td className="p-1 text-right font-bold text-[11px]">{formatJPY(liabilities.reduce((s, r) => s + r.balance, 0))}</td></tr>
                    {liabilities.map(r => renderAccountRow(r.name, r.balance, true))}
                    <tr className="border-t border-slate-400 bg-slate-50">
                      <td className="p-1 font-bold pl-4 text-[10px]">負債合計</td>
                      <td className="p-1 text-right font-bold text-xs border-b-2 border-slate-900">{formatJPY(liabilities.reduce((s, r) => s + r.balance, 0))}</td>
                    </tr>
                    <tr className="bg-slate-50 border-b-2 border-slate-900">
                      <td colSpan={2} className="p-1 font-bold text-center text-[10px]">純資産</td>
                    </tr>
                    <tr><td className="p-1 font-bold pt-2 text-[10px]">I 株主資本</td><td className="p-1 text-right font-bold pt-2 text-[11px]">{formatJPY(equity.reduce((s, r) => s + r.balance, 0) + netIncome)}</td></tr>
                    {equity.find(r => r.code === '300') && renderAccountRow("資本金", results.find(r => r.code === '300')?.balance || 0, true)}
                    <tr><td className="p-1 pl-4 text-[10px]">利益剰余金</td><td className="p-1 text-right text-[11px]">{formatJPY((results.find(r => r.code === '310')?.balance || 0) + netIncome)}</td></tr>
                    {renderAccountRow("当期純利益", netIncome, true)}
                    <tr className="border-t border-slate-400 bg-slate-50">
                      <td className="p-1 font-bold pl-4 text-[10px]">純資産合計</td>
                      <td className="p-1 text-right font-bold text-xs border-b-2 border-slate-900">{formatJPY(equity.reduce((s, r) => s + r.balance, 0) + netIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr className="border-t-2 border-slate-900 font-bold bg-slate-100 text-[11px]">
              <td className="p-2 border-r-2 border-slate-900">資産合計</td>
              <td className="p-2 text-right border-r-2 border-slate-900">{formatJPY(assets.reduce((s, r) => s + r.balance, 0))}</td>
              <td className="p-2 border-r border-slate-400">負債及び純資産合計</td>
              <td className="p-2 text-right">{formatJPY(liabilities.reduce((s, r) => s + r.balance, 0) + equity.reduce((s, r) => s + r.balance, 0) + netIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderOfficialPL = () => {
    const revenues = results.filter(r => r.type === 'revenue');
    const expenses = results.filter(r => r.type === 'expense');
    const revenueTotal = revenues.reduce((s, r) => s + r.balance, 0);
    const expenseTotal = expenses.filter(e => e.code < '510').reduce((s, r) => s + r.balance, 0);
    const sgaTotal = expenses.filter(e => e.code >= '510').reduce((s, r) => s + r.balance, 0);

    return (
      <div className="print-section bg-white border border-gray-200 font-serif text-sm leading-relaxed text-slate-900 report-page report-page-3">
        <h3 className="text-2xl font-bold text-center mb-4 underline underline-offset-4 tracking-[0.6rem] whitespace-nowrap">損 益 計 算 書</h3>
        <p className="text-center mb-6 text-slate-600 text-xs">
          自 {formatDateJP(settings.fiscalYearStart)}<br />
          至 {formatDateJP(settings.fiscalYearEnd || settings.fiscalYearStart)}
        </p>

        <div className="flex justify-between mb-4 text-slate-700 text-xs">
          <span>{settings.companyName}</span>
          <span>（単位：円）</span>
        </div>

        <div className="border-t-2 border-slate-900 py-4 space-y-4">
          <div className="flex justify-between font-bold text-base">
            <span>I 売上高</span>
            <span className="border-b border-slate-900 w-48 text-right">{formatJPY(revenueTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>II 売上原価</span>
            <span className="border-b border-slate-900 w-48 text-right">{formatJPY(expenseTotal)}</span>
          </div>
          <div className="flex justify-between font-bold pl-10 text-base">
            <span>売上総利益</span>
            <span className="border-b border-slate-900 w-48 text-right">{formatJPY(revenueTotal - expenseTotal)}</span>
          </div>

          <div className="flex justify-between font-bold mt-4 text-base">
            <span>III 販売費及び一般管理費</span>
            <span className="border-b border-slate-900 w-48 text-right">{formatJPY(sgaTotal)}</span>
          </div>
          <div className="space-y-1">
            {expenses.filter(e => e.code >= '510').map(e => (
              <div key={e.id} className="flex justify-between pl-10 text-xs text-slate-800">
                <span>{e.name}</span>
                <span className="w-48 text-right">{formatJPY(e.balance)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <div className="flex justify-between font-bold mt-2 pt-2 border-t-2 border-slate-900 text-base">
              <span>営業利益</span>
              <span className="border-b-4 border-double border-slate-900 w-48 text-right">{formatJPY(revenueTotal - expenseTotal - sgaTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>経常利益</span>
              <span className="border-b-4 border-double border-slate-900 w-48 text-right">{formatJPY(revenueTotal - expenseTotal - sgaTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>税引前当期純利益</span>
              <span className="border-b-4 border-double border-slate-900 w-48 text-right">{formatJPY(netIncome)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg bg-slate-50 p-2 border-t border-b-4 border-double border-slate-900 items-baseline">
              <span className="tracking-widest">当 期 純 利 益</span>
              <span className="text-xl">{formatJPY(netIncome)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotes = () => (
    <div className="bg-white border border-gray-200 font-serif text-sm leading-relaxed report-page report-page-5">
      <h3 className="text-2xl font-bold text-center mb-8 underline underline-offset-4 tracking-[0.5rem]">注記表</h3>
      <div className="space-y-6">
        <section>
          <h4 className="font-bold border-b-2 border-gray-700 mb-2">1. 重要な会計方針に関する注記</h4>
          <div className="pl-4 space-y-2 text-sm">
            <p>(1) 固定資産の減価償却の方法<br />有形固定資産については定額法によっております。</p>
            <p>(2) 消費税等の会計処理<br />消費税及び地方消費税の会計処理は、{settings.taxMethod || '税込方式'}によっております。</p>
          </div>
        </section>

        <section>
          <h4 className="font-bold border-b-2 border-gray-700 mb-2">2. 株主資本等変動計算書に関する注記</h4>
          <div className="pl-4 text-sm">
            <p>当期末における発行済株式の総数 {settings.issuedShares || '普通株式 100株'}</p>
          </div>
        </section>

        <section>
          <h4 className="font-bold border-b-2 border-gray-700 mb-2">3. その他の注記</h4>
          <div className="pl-4 text-sm whitespace-pre-wrap">
            <p>{settings.otherNotes || '特記事項なし。'}</p>
          </div>
        </section>
      </div>
    </div>
  );

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
    const revenues = results.filter(r => r.type === 'revenue' && (r.debitTotal !== 0 || r.creditTotal !== 0));
    const expenses = results.filter(r => r.type === 'expense' && (r.debitTotal !== 0 || r.creditTotal !== 0));
    return (
      <div className="bg-white p-8 border border-gray-200 shadow-sm max-w-2xl mx-auto print:shadow-none print:border-none">
        <h3 className="text-xl font-bold text-center mb-8">損益計算書</h3>
        <p className="text-xs text-right mb-4">単位：円</p>
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
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2 bg-gray-50">
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
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2 bg-gray-50">
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
    const assets = results.filter(r => r.type === 'asset' && (r.debitTotal !== 0 || r.creditTotal !== 0));
    const liabilities = results.filter(r => r.type === 'liability' && (r.debitTotal !== 0 || r.creditTotal !== 0));
    const equity = results.filter(r => r.type === 'equity' && (r.debitTotal !== 0 || r.creditTotal !== 0));
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
          <button
            className={`px-4 py-2 rounded-md transition ${type === 'REPORT' ? 'bg-white shadow-sm font-bold' : 'hover:bg-gray-300'}`}
            onClick={() => setType('REPORT')}
          >決算報告書パック</button>
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
        {type === 'REPORT' && (
          <div className="space-y-8 print:space-y-0">
            <div>{renderCover()}</div>
            <div>{renderOfficialBS()}</div>
            <div>{renderOfficialPL()}</div>
            <div>{renderEquity()}</div>
            <div>{renderNotes()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
