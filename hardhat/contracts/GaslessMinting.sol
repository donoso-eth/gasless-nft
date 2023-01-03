//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract GaslessMinting is ERC721 {

    uint256 public _tokenId;


    constructor()ERC721("GLN","Gass Less Nft") {
   
    }

    function mint() external {
        _safeMint(msg.sender, _tokenId);
        _tokenId++;
    }

}
