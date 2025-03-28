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
const Web3 = require('web3');
const fs = require('fs');
const web3 = new Web3();

const besuRpcUrl = process.env.RPC_URL; // エンドポイントを設定
web3.setProvider(new web3.providers.HttpProvider(besuRpcUrl));

const deploy = async () => {
  try {
    const contractName = process.env.CONTRACT_NAME
    // コンパイルしたスマートコントラクトの情報
    const contractData = JSON.parse(fs.readFileSync('./artifacts/contracts/'+contractName+'.sol/'+contractName+'.json', 'utf8'));
    // bytecodeとabiの取得
    const bytecode = contractData.bytecode;
    const abi = contractData.abi;
    // 送信者のプライベートキー
    const privateKey = process.env.PRIVATE_KEY;
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    console.log("Creating transaction...");
    const txnCount = await web3.eth.getTransactionCount(account.address);

    const rawTxOptions = {
      nonce: web3.utils.numberToHex(txnCount),
      from: account.address,                              // 送信元アドレス
      to: null,                                           // 送信先アドレス
      value: "0x00",
      data: bytecode,                              // contract binary appended
      gas: web3.utils.toHex(3000000),                     // ガスリミット
    };
    // トランザクションに署名
    console.log("Signing transaction...");
    const signedTx = await account.signTransaction(rawTxOptions);
    console.log("Sending transaction...");
    // トランザクションを送信
    const pTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("tx transactionHash: " + pTx.transactionHash);
    console.log("tx contractAddress: " + pTx.contractAddress);
  } catch (error) {
    console.error("エラー:", error);
  }
};

// 実行
console.log('deploy');
deploy();


