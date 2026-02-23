import Dexie, { type Table } from 'dexie';

export interface Account {
  id?: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  isActive: boolean;
}

export interface Journal {
  id?: string;
  date: string;
  description: string;
  createdAt: number;
}

export interface JournalLine {
  id?: string;
  journalId: string;
  accountId: string;
  debit: number;
  credit: number;
}

export interface FixedAsset {
  id?: string;
  name: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: 'straight-line' | 'declining-balance';
  isDisposed: boolean;
  disposalDate?: string;
  disposalAmount?: number;
}

export interface AppSetting {
  key: string;
  value: any;
}

export class AccountingDatabase extends Dexie {
  accounts!: Table<Account>;
  journals!: Table<Journal>;
  journalLines!: Table<JournalLine>;
  fixedAssets!: Table<FixedAsset>;
  settings!: Table<AppSetting>;

  constructor() {
    super('AccountingDB');
    this.version(1).stores({
      accounts: 'id, code, name, type, isActive',
      journals: 'id, date, createdAt',
      journalLines: 'id, journalId, accountId',
      fixedAssets: 'id, name, acquisitionDate',
      settings: 'key'
    });
  }
}

export const db = new AccountingDatabase();

export const initialAccounts: Omit<Account, 'id'>[] = [
  // Assets
  { code: '100', name: '現金', type: 'asset', isActive: true },
  { code: '101', name: '普通預金', type: 'asset', isActive: true },
  { code: '110', name: '売掛金', type: 'asset', isActive: true },
  { code: '150', name: '備品', type: 'asset', isActive: true },

  // Liabilities
  { code: '200', name: '買掛金', type: 'liability', isActive: true },
  { code: '210', name: '未払金', type: 'liability', isActive: true },
  { code: '250', name: '借入金', type: 'liability', isActive: true },

  // Equity
  { code: '300', name: '資本金', type: 'equity', isActive: true },
  { code: '310', name: '繰越利益剰余金', type: 'equity', isActive: true },

  // Revenues
  { code: '400', name: '売上高', type: 'revenue', isActive: true },

  // Expenses
  { code: '500', name: '仕入高', type: 'expense', isActive: true },
  { code: '510', name: '支払家賃', type: 'expense', isActive: true },
  { code: '520', name: '給与手当', type: 'expense', isActive: true },
  { code: '530', name: '旅費交通費', type: 'expense', isActive: true },
  { code: '540', name: '通信費', type: 'expense', isActive: true },
  { code: '550', name: '消耗品費', type: 'expense', isActive: true },
  { code: '560', name: '減価償却費', type: 'expense', isActive: true },
];

export async function seedDatabase() {
  const count = await db.accounts.count();
  if (count === 0) {
    const accountsWithId = initialAccounts.map(a => ({ ...a, id: crypto.randomUUID() }));
    await db.accounts.bulkAdd(accountsWithId);
    await db.settings.add({ key: 'fiscalYearStart', value: '2025-01-01' });
    await db.settings.add({ key: 'companyName', value: 'サンプル株式会社' });
  }
}
