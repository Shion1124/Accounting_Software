# Shion会計 (Shion Accounting)

1人会社・免税事業者に特化した、インストール不要のローカル完結型会計ソフトです。
開発者: Shion

## 🌟 プロジェクトの特徴

- **完全ローカル完結**: データはブラウザ内（IndexedDB）にのみ保存されます。外部サーバーへ情報を送信しないため、財務データのプライバシーが完全に守られます。
- **提出パッケージ作成**: ブラウザの印刷機能（window.print）に最適化されたCSSを適用。税理士や税務署への提出に適したレイアウトのPDF（BS/PL/試算表/総勘定元帳）を即座に生成できます。
- **自動償却ロジック**: 固定資産台帳から、毎期の減価償却仕訳をボタン一つで自動生成。複雑な計算を手動で行う必要はありません。
- **ミニマル設計**: 免税事業者の法人決算にターゲットを絞り、消費税計算や複雑な機能をあえて排除することで、迷わない操作性を実現しました。
- **バックアップ・復元**: JSON形式でのデータエクスポート・インポート機能を備えており、PCの買い替えやデータのバックアップも容易です。

## 🛠 技術スタック

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide-react (Icons)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Utilities**: date-fns (Date manipulation), uuid (ID generation)

## 🚀 クイックスタート

1. リポジトリをクローン
2. 依存関係のインストール: `npm install`
3. 開発サーバーの起動: `npm run dev`

## 📄 ライセンス

MIT License
