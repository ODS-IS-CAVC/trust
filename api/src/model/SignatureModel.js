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

const ethSigUtil = require('@metamask/eth-sig-util');
const momentTimezone = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

class SignatureModel {

  constructor(account, privateKey) {

    this.account = account;
    this.privateKey = privateKey;

    this.domain = {
      name: 'EthereumEip712Signature2021',
    };

    this.types = {
      CredentialSubject: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' }
      ],
      Issuer: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' }
      ],
      Document: [
        { name: '@context', type: 'string[]' },
        { name: 'id', type: 'string' },
        { name: 'type', type: 'string[]' },
        { name: 'credentialSubject', type: 'CredentialSubject' },
        { name: 'issuer', type: 'Issuer' },
        { name: 'validFrom', type: 'string' },
        { name: 'validUntil', type: 'string' }
      ]
    };
  }

  create(message) {
    try {
      // ID, @context, type, validFrom, validUntilを追加
      message['id'] = uuidv4();
      message['@context'] = ["https://www.w3.org/2018/credentials/v1"];
      message['type'] = ["VerifiableCredential", "BLDocument"];
      message['validFrom'] = new Date().toISOString();
      message['validUntil'] = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1年後

      const sign = ethSigUtil.signTypedData({
        privateKey: this.privateKey,
        data: {
          types: this.types,
          primaryType: 'Document',
          domain: this.domain,
          message: message
        },
        version: ethSigUtil.SignTypedDataVersion.V4
      });

      let signature = { ...message };

      signature.proof = {
        "eip712": this.types,
        "proofPurpose": "assertionMethod",
        "proofValue": sign,
        "type": "EthereumEip712Signature2021",
        "verificationMethod": "did:pkh:eip155:1:0xAED7EA8035eEc47E657B34eF5D020c7005487443#blockchainAccountId",
      };
      
      return signature;

    } catch (error) {
      throw new Error(`Signature creation failed: ${error.message}`);
    }
  }

  verify(account, signature, message) {
    try {

      const signer = ethSigUtil.recoverTypedSignature({
        data: {
          types: this.types,
          primaryType: 'Document',
          domain: this.domain,
          message: message
        },
        signature,
        version: ethSigUtil.SignTypedDataVersion.V4
      });

      const isValid = signer.toLowerCase() === account.toLowerCase();
      return isValid;

    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  hash(signature) {
    return ethSigUtil.hashTypedDataV4(signature);
  }

}

module.exports = SignatureModel;