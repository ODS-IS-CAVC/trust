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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BLNFT is ERC721, Ownable {

    uint256 private _currentTokenId;
    
    mapping(uint256 => bytes32) public data;
    mapping(uint256 => bool) public invalidated;
    mapping(uint256 => bool) public used;
    mapping(uint256 => address[]) public ownershipHistory;

    mapping(uint256 => address) public pendingTransfers;
    
    event TransferRequested(uint256 indexed tokenId, address indexed from, address indexed to);
    event TransferAccepted(uint256 indexed tokenId, address indexed from, address indexed to, bytes32 newBLHash);
    event Invalidated(uint256 indexed tokenId, address owner);
    event Used(uint256 indexed tokenId, address owner);

    constructor() ERC721("BLNFT", "BLNFT") Ownable(_msgSender()) {}

    function mint(bytes32 blHash) external {
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        _safeMint(msg.sender, newTokenId);
        data[newTokenId] = blHash;
        ownershipHistory[newTokenId].push(msg.sender);
    }

    function requestTransfer(uint256 tokenId, address to) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        require(!invalidated[tokenId], "Invalidated B/L cannot transfer");
        require(to != address(0), "Invalid address");
        
        pendingTransfers[tokenId] = to;
        approve(address(0), tokenId);
        approve(to, tokenId);
        emit TransferRequested(tokenId, ownerOf(tokenId), to);
    }
    
    function acceptTransfer(uint256 tokenId, bytes32 newBLHash) external {
        require(pendingTransfers[tokenId] == msg.sender, "No transfer request for you");
        
        address from = ownerOf(tokenId);
        address to = msg.sender;
        
        pendingTransfers[tokenId] = address(0);
        
        data[tokenId] = newBLHash;
        
        _transfer(from, to, tokenId);
        ownershipHistory[tokenId].push(to);
        
        emit TransferAccepted(tokenId, from, to, newBLHash);
    }
    
    function invalidate(uint256 tokenId) external {
        require(_isOwnerOrIssuer(msg.sender, tokenId), "Not owner nor issuer");
        require(!invalidated[tokenId], "Already invalidated");
        
        invalidated[tokenId] = true;
        
        emit Invalidated(tokenId, ownerOf(tokenId));
    }
    
    function use(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        require(!invalidated[tokenId], "Already invalidated");
        require(!used[tokenId], "Already used");

        used[tokenId] = true;

        emit Used(tokenId, ownerOf(tokenId));
    }

    function verify(uint256 tokenId, bytes32 hash) external view returns (bool) {
        return data[tokenId] == hash;
    }
    
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);

        if (from != address(0)) {
            require(!invalidated[tokenId], "Invalidated B/L cannot be transferred");
        }

        return from;
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return _isAuthorized(tokenOwner, spender, tokenId);
    }

    function ownershipHistoryLength(uint256 tokenId) external view returns (uint256) {
        return ownershipHistory[tokenId].length;
    }

    function _isOwnerOrIssuer(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        address tokenIssuer = ownershipHistory[tokenId][0];
        return spender != address(0) &&
            (tokenOwner == spender || tokenIssuer == spender);
    }
}
