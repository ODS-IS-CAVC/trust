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

var Web3 = require('web3');
var web3 = new Web3();

const besuRpcUrl = "http://<接続先IP>:<RPCのポート>"; // エンドポイントを設定
web3.setProvider(new web3.providers.HttpProvider(besuRpcUrl));

// 送信者のプライベートキー
const privateKey = "8312583b8f0bf046000d4f451628b5453a706a4116adda5defaf30e58cdeaa73";
const account = web3.eth.accounts.privateKeyToAccount(privateKey);


// トランザクション送信関数
async function sendTransaction() {
  try {
    // 受取のアドレス
    var to_address = 'ece31d41ec5ef746f7d07d3511ca24ae424315ef';
    // 送信者のアドレス
    var from_address = '37cce6063ffe412258dd60a1e3ec69dd6971bde4';
    
    console.log('getBalance before');
    web3.eth.getBalance(to_address, (error, balance) => {
      console.log("to:" + web3.utils.fromWei(balance, "ether"));
    });
    web3.eth.getBalance(from_address, (error, balance) => {
      console.log("from:" + web3.utils.fromWei(balance, "ether"));
    });

    // トランザクションデータの作成
    const txData = {
      from: account.address,         // 送信元アドレス
      to: to_address,     // 送信先アドレス
      value: web3.utils.toWei("0.0001", "ether"), // 送金額（Ether）
      gas: "0x1ffffffffffffe",                    // ガスリミット
    };

    // トランザクションのナンスを取得
    txData.nonce = await web3.eth.getTransactionCount(account.address);

    // トランザクションに署名
    const signedTx = await account.signTransaction(txData);

    // トランザクションを送信
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("トランザクション送信完了:", receipt.transactionHash);
    console.log("トランザクションのレシート:", receipt);
    console.log('getBalance after');
    web3.eth.getBalance(to_address, (error, balance) => {
      console.log("to:" + web3.utils.fromWei(balance, "ether"));
    });
    web3.eth.getBalance(from_address, (error, balance) => {
      console.log("from:" + web3.utils.fromWei(balance, "ether"));
    });
  } catch (error) {
    console.error("エラー:", error);
  }
}

// 実行
console.log('sendTransaction');
sendTransaction();


