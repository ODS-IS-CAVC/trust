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

const SignatureModel = require("../model/SignatureModel");
const MySql = require('../model/mySql');
const fs = require('fs');

function logErrorToFile(error) {
    const logMessage = `${new Date().toISOString()} - Error: ${error.message}\nStack trace: ${error.stack}\n\n`;
    fs.appendFile('error.log', logMessage, (err) => {
        if (err) console.error('Failed to write error log:', err);
    });
}

exports.verify = async (req, res) => {

    const { cid, signature } = req.body;

    try {

        // 必須フィールドの検証
        if (!cid) {
            throw new Error('CIDは必須です');
        }
        if (!signature) {
            throw new Error('電子署名情報は必須です');
        }
        const parsedData = JSON.parse(JSON.stringify(signature));
        if (typeof parsedData !== 'object') {
            throw new Error('電子署名情報は有効なJSON形式ではありません');
        }
        if (!signature.proof) {
            throw new Error('電子署名が付与されていません');
        }
        if (!signature.proof.proofValue) {
            throw new Error('電子署名が付与されていません');
        }
        const db = new MySql();
        const wallet = await db.getWallet(cid);
        if (!wallet) {
            throw new Error('CIDが存在しません。');
        }
        // 接続情報設定・取得
        const address = wallet.walletAddress
        const privateKey = wallet.privateKey
        const signatureModel = new SignatureModel(address, privateKey);

        const message = (({ proof, ...rest }) => rest)(signature);
        
        const isValid = signatureModel.verify(address, signature.proof.proofValue, message);

        res.status(200).json({
            status: 'success',
            isValid: isValid,
        });

    } catch(error) {
        logErrorToFile(error);
        res.status(503).json({
            status: 'error',
            message: error.message,
        });
    }
};

