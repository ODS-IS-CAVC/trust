# Smart Contract

このディレクトリには、物流におけるB/Lを表現するNFTのスマートコントラクトが含まれています。

## コントラクトの概要

### BLNFT.sol
- B/Lを表現するNFTコントラクト
- 主な機能:
  - B/Lの発行(mint)
  - B/Lの移転申請と受領承認(requestTransfer/acceptTransfer)
  - B/Lの無効化(invalidate)
  - B/Lの使用済み処理(use)
  - B/Lデータの検証(verify)

## 開発環境

- Solidity ^0.8.20
- OpenZeppelin Contracts ^5.2.0
  - ERC721
  - Ownable

## コンパイル

### packageインストール
```
npm install
```
### コンパイル実行
```
npx hardhat compile 
```
※再コンパイルする場合は、```artifacts```, ```cache``` フォルダを削除する。

## デプロイ
### envファイル設定
```
RPC_URL=デプロイ先のURL
CONTRACT_NAME=solファイル名
PRIVATE_KEY=コントラクトを作成するアカウント
```
### デプロイ実行
```
node deploySmartContract.js
```
実行結果

```
tx transactionHash: 送信したトランザクション
tx contractAddress: 作成されたコントラクトのアドレス
```