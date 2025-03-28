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
const BlockchainModel = require('./blockchain');
const gas = "0x1ffffffffffffe";

class BlNft extends BlockchainModel{
    /**
     * B/L情報登録
     */
    async mint(bl_hash){
        try {
            // トランザクション作成
            const signTx = await this.createTransaction("mint", [bl_hash]);
            // トランザクション送信
            const receipt = await this.sendTransaction(signTx);
            // 実行ログから Token ID を取得
            const logs = receipt.logs;
        
            // Transfer イベントのトピック
            const transferEventSignature = this.web3.utils.keccak256("Transfer(address,address,uint256)");
            let tokenId = '';
            // 対象のログを検索
            for (const log of logs) {
                if (log.topics[0] === transferEventSignature) {
                    const decoded = this.web3.eth.abi.decodeLog(
                        [
                            { type: "address", name: "from", indexed: true },
                            { type: "address", name: "to", indexed: true },
                            { type: "uint256", name: "tokenId", indexed: true }
                        ],
                        log.data,
                        log.topics.slice(1)
                    );
                
                    console.log("Token ID:", decoded.tokenId);
                    tokenId = decoded.tokenId;
                    break; // ループを抜ける
                }
            }
            return tokenId;
        } catch (error) {
            throw new Error(`BLNFT mint failed: ${error.message}`);
        }
    }
    /**
     * B/L情報移転申請
     */
    async requestTransfer(tokenId, to){
        try {
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            // トランザクション作成
            const signTx = await this.createTransaction("requestTransfer", [tokenId, to]);
            // トランザクション送信
            const receipt = await this.sendTransaction(signTx);
            return receipt.status ?? false;
        } catch (error) {
            throw new Error(`BLNFT requestTransfer failed: ${error.message}`);
        }
    }
    /**
     * B/L情報受領承認
     */
    async acceptTransfer(tokenId, newBLHash){
        try {
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            // トランザクション作成
            const signTx = await this.createTransaction("acceptTransfer", [tokenId, newBLHash]);
            // トランザクション送信
            const receipt = await this.sendTransaction(signTx);
            return receipt.status ?? false;
        } catch (error) {
            throw new Error(`BLNFT acceptTransfer failed: ${error.message}`);
        }
    }
    /**
     * B/L情報破棄
     */
    async invalidate(tokenId){
        try {
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            // トランザクション作成
            const signTx = await this.createTransaction("invalidate", [tokenId]);
            // トランザクション送信
            const receipt = await this.sendTransaction(signTx);
            return receipt.status ?? false;
        } catch (error) {
            throw new Error(`BLNFT invalidate failed: ${error.message}`);
        }
    }
    /**
     * B/L情報使用済み
     */
    async used(tokenId){
        try {
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            // トランザクション作成
            const signTx = await this.createTransaction("use", [tokenId]);
            // トランザクション送信
            const receipt = await this.sendTransaction(signTx);
            return receipt.status ?? false;
        } catch (error) {
            throw new Error(`BLNFT use failed: ${error.message}`);
        }
    }
    /**
     * B/L情報検証
     */
    async verify(tokenId, hash){
        try {
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            return await this.call("verify", [tokenId, hash]);
        } catch (error) {
            throw new Error(`BLNFT verify failed: ${error.message}`);
        }
    }

    /**
     * B/L情報取得
     * （used、invalidateの状況とオーナーと最新ハッシュ）
     */
    async detail(tokenId){
        try {
            // ownerShip
            // 所有者履歴が空の場合はそもそも取得できてないのでエラー利用する
            const ownershipHistory = await this.ownershipHistory(tokenId);
            // used
            const used = await this.call('used', [tokenId]);
            // invalidate
            const invalidate = await this.call('invalidated', [tokenId]);
            // owner
            const owner = await this.call('ownerOf', [tokenId]);
            // hash
            const hash = await this.call('data', [tokenId]);
            return {
                used,
                invalidate,
                owner,
                ownershipHistory,
                hash
            };
        } catch (error) {
            throw new Error(`BLNFT detail failed: ${error.message}`);
        }
    }

    /**
     * B/L情報所有者履歴取得
     * そもそも履歴数が0の場合は存在しないIDなのでエラーハンドリングに利用する
     */
    async ownershipHistory(tokenId){
        // length
        const ownershipHistoryLength = await this.call('ownershipHistoryLength', [tokenId]);
        if (ownershipHistoryLength <= 0) {
            throw new Error("BL情報が存在しません")
        }
        const ownershipHistory = [];
        // ownerShip
        for (let i = 0; i < ownershipHistoryLength; ++i) {
            ownershipHistory.push(await this.call('ownershipHistory', [tokenId, i]));
        }
        return ownershipHistory;
    }

    /**
     * B/L情報
     * 共通トランザクションデータ作成
     */
    async createTransaction(method, inputs) {
        try {
            const data = this.encodeABI(method, inputs);
            // トランザクションデータの作成
            const txData = {
                from: this.address,
                to: this.contractAddress,
                data: data,
                gas: gas
            };
            
            const account = this.getAccount(this.privateKey);
            // トランザクションのナンスを取得
            txData.nonce = await this.getNonce(account);
            // トランザクションの署名
            const signTx = await account.signTransaction(txData);
            return signTx;
        } catch (error) {
            throw new Error(`Failed to create transaction: ${error.message}`);
        }
    }
}

module.exports = BlNft;
