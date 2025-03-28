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
const mysql = require('mysql2/promise');

class MySql {

    constructor () {
        this.db = mysql.createPool({
            host: process.env.MYSQL_HOST, // EC2上のMySQLのホスト名またはIPアドレス
            port: process.env.MYSQL_PORT, // ポート番号
            user: process.env.MYSQL_USER,                 // MySQLのユーザー名
            password: process.env.MYSQL_PASSWORD,             // パスワード
            database: process.env.MYSQL_DB,              // 使用するデータベース名
            connectionLimit: 151, // 接続を張り続けるコネクション数を指定（MySQLデフォルト上限）
            namedPlaceholders: true, // 設定必須
        });
    }

    async getWallet(cid) {
        let connection;
        try {
            connection = await this.db.getConnection();
            const [resultRows] = await connection.query(
                "SELECT walletAddress, privateKey FROM wallets WHERE cid = :cid",
                { cid: cid }
            );
            return resultRows[0]; // 最初の行を返す
        } catch (err) {
            console.error('Error in getWallet:', err);
            throw err; // エラーを再スロー
        } finally {
            if (connection) connection.release(); // 明示的に接続を返却
        }
    }
}

module.exports = MySql;
