/**
 * Copyright 2025 Intent Exchange, Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');
const { ethers } = require('ethers');

// === 1. DB接続情報 ===
const dbConfig = {
    host: 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
};

// === 2. テーブル定義（例） ===
// CREATE TABLE IF NOT EXISTS `wallets` (
//   `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//   `cid` VARCHAR(255) NOT NULL UNIQUE,
//   `walletAddress` VARCHAR(255) NOT NULL,
//   `privateKey` VARCHAR(255) NOT NULL
// );

// === 3. メイン関数 ===
async function main() {
    // MySQLに接続
    const connection = await mysql.createConnection(dbConfig);

    try {
        // ファイル読み込みのためのストリームと readline インタフェース生成
        const fileStream = fs.createReadStream('cids.txt', { encoding: 'utf-8' });
        const rl = readline.createInterface({ input: fileStream });

        // 一行ずつ処理
        for await (const line of rl) {
            const cid = line.trim();
            if (!cid) {
                continue; // 空行や不要行はスキップ
            }

        // すでにテーブルに存在するか確認
            const [rows] = await connection.execute(
                'SELECT id FROM wallets WHERE cid = ?',
                [cid]
            );

            if (rows.length > 0) {
                // 既に登録済み
                console.log(`CID "${cid}" は既に存在します。スキップします。`);
            } else {
                // 新規レコードとしてウォレット生成
                const wallet = ethers.Wallet.createRandom();

                // DBへ挿入
                await connection.execute(
                'INSERT INTO wallets (cid, walletAddress, privateKey) VALUES (?, ?, ?)',
                [cid, wallet.address, wallet.privateKey.slice(2)]
                );

                console.log(`CID "${cid}" を登録しました: address=${wallet.address}`);
            }
        }
    } catch (err) {
        console.error('エラーが発生しました:', err);
    } finally {
        // DB接続をクローズ
        await connection.end();
    }
}

main().then(() => {
    console.log('処理が完了しました。');
}).catch((err) => {
    console.error('main関数のエラー:', err);
});