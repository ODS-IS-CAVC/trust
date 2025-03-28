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
const BlNft = require('../model/blNft');
const MySql = require('../model/mySql');
const SignatureModel = require('../model/SignatureModel');
const fs = require('fs');
const nodeUrl = process.env.NODE_URL;
const contractAddress = process.env.BL_CONTRACT_ADDRESS;
const abi = JSON.parse(fs.readFileSync('src/abi/bl.json', 'utf8'));

function logDebugToFile(message) {
  const logMessage = `${new Date().toISOString()} - Debug: ${message}\n`;
  fs.appendFile('error.log', logMessage, (err) => {
    if (err) console.error('Failed to write debug log:', err);
  });
}
function logErrorToFile(error) {
  const logMessage = `${new Date().toISOString()} - Error: ${error.message}\nStack trace: ${error.stack}\n\n`;
  fs.appendFile('error.log', logMessage, (err) => {
    if (err) console.error('Failed to write error log:', err);
  });
}

exports.register = async (req, res) => {

  const { cid, bl_json } = req.body;

  try {

    // 必須フィールドの検証
    if (!cid) {
      throw new Error('CIDは必須です');
    }
    if (!bl_json) {
      throw new Error('BL情報は必須です');
    }
    const parsedData = JSON.parse(JSON.stringify(bl_json));
    if (typeof parsedData !== 'object') {
      throw new Error('BL情報は有効なJSON形式ではありません');
    }
    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }

    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)
    // BL情報の形式検証
    const bl_data = JSON.parse(JSON.stringify(bl_json));
    const signature = new SignatureModel(address, privateKey);
    // 電子署名付与
    const signed_bl_data = signature.create(bl_data);
    // ハッシュ化
    const bl_hash = smartContract.toHash(JSON.stringify(signed_bl_data));
    // スマートコントラクトに送信
    const bl_id = await smartContract.mint(bl_hash);

    res.status(200).json({
      bl_id: bl_id,
      signed_bl: signed_bl_data,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.transfer = async (req, res) => {

  const { cid, bl_id, to_address } = req.body;

  try {

    if (!cid) {
      throw new Error('CIDは必須です');
    }
    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }

    if (!to_address) {
      throw new Error('宛先アドレスは必須です');
    }

    if (typeof bl_id !== 'number') {
      throw new Error('BL IDが不正です');
    }

    if (typeof to_address !== 'string' || to_address.length !== 42) {
      throw new Error('宛先アドレスが不正です');
    }

    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }
    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)

    // スマートコントラクトに送信
    const result = await smartContract.requestTransfer(bl_id, to_address);

    res.status(200).json({
      result: result,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.approve = async (req, res) => {

  const { cid, bl_id, signed_bl } = req.body;

  try {

    if (!cid) {
      throw new Error('CIDは必須です');
    }
    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }

    if (!signed_bl) {
      throw new Error('BL情報は必須です');
    }
    const parsedData = JSON.parse(JSON.stringify(signed_bl));
    if (typeof parsedData !== 'object') {
      throw new Error('BL情報は有効なJSON形式ではありません');
    }

    if (typeof bl_id !== 'number') {
      throw new Error('BL IDが不正です');
    }

    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }
    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)
    // BL情報の形式検証
    const signed_bl_data = JSON.parse(JSON.stringify(signed_bl));
    const bl_data = JSON.parse(JSON.stringify(signed_bl));
    delete bl_data.proof;
    const proofValue = signed_bl_data.proof.proofValue;
    // 検証
    const signature = new SignatureModel(address, privateKey);
    // 現所有者のアドレス取得
    const detail = await smartContract.detail(bl_id);
    if (!signature.verify(detail.owner, proofValue, bl_data)) {
      throw new Error('BL情報に付与されている電子署名が不正です');
    }
    // 電子署名付与
    const signed_signed_bl = signature.create(signed_bl_data);
    // ハッシュ化
    const bl_hash = smartContract.toHash(JSON.stringify(signed_signed_bl));
    // スマートコントラクトに送信
    const result = await smartContract.acceptTransfer(bl_id, bl_hash);

    res.status(200).json({
      result: result,
      signed_signed_bl: signed_signed_bl,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.verify = async (req, res) => {

  const { cid, bl_id, signed_bl } = req.body;

  try {

    if (!cid) {
      throw new Error('CIDは必須です');
    }

    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }

    if (!signed_bl) {
      throw new Error('BL情報は必須です');
    }
    const parsedData = JSON.parse(JSON.stringify(signed_bl));
    if (typeof parsedData !== 'object') {
      throw new Error('BL情報は有効なJSON形式ではありません');
    }

    if (typeof bl_id !== 'number') {
      throw new Error('BL IDが不正です');
    }

    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }
    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)
    // BL情報の形式検証
    const signed_bl_data = JSON.parse(JSON.stringify(signed_bl));
    const bl_data = JSON.parse(JSON.stringify(signed_bl));
    delete bl_data.proof;
    const proofValue = signed_bl_data.proof.proofValue;
    // 検証
    const signature = new SignatureModel(address, privateKey);
    // 現所有者のアドレス取得
    const detail = await smartContract.detail(bl_id);
    if (!signature.verify(detail.owner, proofValue, bl_data)) {
      throw new Error('BL情報に付与されている電子署名が不正です');
    }
    // ハッシュ化
    const bl_hash = smartContract.toHash(JSON.stringify(signed_bl_data));

    // スマートコントラクトに送信
    const result = await smartContract.verify(bl_id, bl_hash);

    res.status(200).json({
      result: result,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.detail = async (req, res) => {

  const { bl_id } = req.query;

  try {

    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }
    if (!Number.isFinite(Number(bl_id))) {
      throw new Error('BL IDが不正です');
    }

    // クエリのためnumberチェックは不要
    // スマートコントラクトに送信
    const result = await new BlNft(nodeUrl, abi, contractAddress).detail(bl_id);

    res.status(200).json({
      status: true,
      bl_hash: result.hash,
      owner: result.owner,
      ownershipHistory: result.ownershipHistory,
      invalidate: result.invalidate,
      used: result.used,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
}

exports.deactive = async (req, res) => {

  const { cid, bl_id } = req.body;

  try {

    if (!cid) {
      throw new Error('CIDは必須です');
    }

    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }

    if (typeof bl_id !== 'number') {
      throw new Error('BL IDが不正です');
    }
    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }
    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)
    // スマートコントラクトに送信
    const result = await smartContract.invalidate(bl_id);

    res.status(200).json({
      result: result,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    return res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
}

exports.used = async (req, res) => {

  const { cid, bl_id } = req.body;

  try {

    if (!cid) {
      throw new Error('CIDは必須です');
    }

    if (!bl_id) {
      throw new Error('BL IDは必須です');
    }

    if (typeof bl_id !== 'number') {
      throw new Error('BL IDが不正です');
    }
    const db = new MySql();
    const wallet = await db.getWallet(cid);
    if (!wallet) {
      throw new Error('CIDが存在しません。');
    }
    // 接続情報設定・取得
    const smartContract = new BlNft(nodeUrl, abi, contractAddress);
    const address = wallet.walletAddress
    const privateKey = wallet.privateKey
    smartContract.setAccount(address, privateKey)
    // スマートコントラクトに送信
    const result = await smartContract.used(bl_id);

    res.status(200).json({
      result: result,
      status: 'success',
    });

  } catch (error) {
    logErrorToFile(error);
    return res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
}
