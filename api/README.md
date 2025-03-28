

# Trust API

このディレクトリには、トラストAPIのコードが含まれています。

## 必要条件
- Node.js (v18以上)
- npm (v9以上)

## インストール
```bash
# リポジトリのクローン
git clone https://github.com/IX-co-logi/trust.git

# プロジェクトディレクトリに移動
cd trust/api

# 依存関係のインストール
npm install
```

## 環境設定
1. `.env.example` を `.env` にコピーします：
```bash
cp .env.example .env
```

2. `.env` ファイルを編集し、必要な環境変数を設定します：
```
PORT=3000
NODE_URL=
# スマートコントラクト
BL_CONTRACT_ADDRESS=
# DB
MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DB=
```

## 起動方法

### 開発環境
```bash
npm run dev
```

### 本番環境
```bash
npm start
```


## 開発

### ディレクトリ構造
```
api/
├── src/
│   ├── routes/      # ルーティング定義
│   ├── controllers/ # ビジネスロジック
│   └── app.js       # アプリケーションのエントリーポイント
├── .env             # 環境変数
└── package.json
```

### コントローラー機能
### blController.js
- BL情報を登録・操作するコントローラー
- 機能
    - BL情報登録(register)
    - BL情報移転申請(transfer)
    - BL情報受領承認(approve)
    - BL情報検証(verify)
    - BL情報詳細(detail)
    - BL情報破棄(deactive)
    - BL情報使用済(used)

### signController.js
- 電子署名を検証するコントローラー
- 機能
    - 電子署名検証(verify)

### スクリプト
- `npm start`: アプリケーションを起動（PM2使用）
- `npm stop`: アプリケーションを停止
- `npm run dev`: 開発モードでアプリケーションを起動（nodemon使用）

## デプロイ

### PM2を使用したデプロイ
```bash
# PM2のグローバルインストール
npm install pm2 -g

# アプリケーションの起動
pm2 start ecosystem.config.js
```

## CIDと紐づくウォレットアドレスの生成
1. cids.txtにCIDを一行ずつ記載
2. DBにwalletsテーブルを作成
3. スクリプト実行
    ```bash
    node createWallet.js
    ```