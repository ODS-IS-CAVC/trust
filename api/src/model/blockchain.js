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

const Web3 = require('web3');
const abiDecoder = require('abi-decoder');

class BlockchainModel {

  constructor(nodeUrl, abi, contractAddress) {
    const provider = new Web3.providers.HttpProvider(nodeUrl, { keepAlive: false });
    this.web3 = new Web3(provider);
    this.abi = abi;
    this.contractAddress = contractAddress;
    abiDecoder.addABI(abi);
  }

  // トランザクションを取得するメソッド
  async getTransaction(txHash) {
    try {
      return await this.web3.eth.getTransaction(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  // トランザクションを送信するメソッド
  async sendTransaction(signedTransaction) {
    try {
      this.web3.eth.handleRevert = true
      return await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    } catch (error) {
      if (error.reason) {
        throw new Error(`Failed to send transaction: ${error.reason}`);
      } else {
        throw new Error(`Failed to send transaction: ${error.message}`);
      }
    }
  }

  // ガスリミットを取得するメソッド
  async getGasLimit() {
    try {
      const block = await this.web3.eth.getBlock('latest');
      return block.gasLimit;
    } catch (error) {
      throw new Error(`Failed to get gas limit: ${error.message}`);
    }
  }

  async getNonce(account) {
    // トランザクションのナンスを取得
    return await this.web3.eth.getTransactionCount(account.address);
  }

  // ABIとinputを指定してdataを返すメソッド
  encodeABI(method, inputs) {
    try {
      const contract = new this.web3.eth.Contract(this.abi, this.contractAddress);
      return contract.methods[method](...inputs).encodeABI();
    } catch (error) {
      throw new Error(`Failed to encode ABI: ${error.message}`);
    }
  }

  // inputを指定して、methodとinputを返すメソッド
  decodeInput(data) {
    try {
      const decodedData = abiDecoder.decodeMethod(data);
      if (!decodedData) {
        throw new Error('Failed to decode input');
      }
      return decodedData;
    } catch (error) {
      throw new Error(`Failed to decode input: ${error.message}`);
    }
  }

  // methodとinputsを指定して読み取り処理を実行するメソッド
  async call(method, inputs) {
    const contract = new this.web3.eth.Contract(this.abi, this.contractAddress);
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} does not exist in the ABI.`);
    }
    return await contract.methods[method](...inputs).call();
  }

  // プライベートキーからアカウント情報取得
  setAccount(address, privateKey) {
    this.address = address;
    this.privateKey = privateKey;
  }
  // プライベートキーからアカウント情報取得
  getAccount(privateKey) {
    return this.web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  // jsonをkeccak256 hashに変換
  toHash(json) {
    // JSON文字列をハッシュ化
    const hash = this.web3.utils.keccak256(json);
    return hash;
  }
}

module.exports = BlockchainModel;
