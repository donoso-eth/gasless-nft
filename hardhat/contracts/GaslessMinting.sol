//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GaslessMinting is ERC721URIStorage, ERC2771Context {
     using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;

    constructor()
        ERC721("GLN", "Gass Less NFT")
        ERC2771Context(address(0xBf175FCC7086b4f9bd59d5EAE8eA67b8f940DE0d))
    {
       
    }

    function relayMint(string memory tokenURI) external  onlyTrustedForwarder returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(_msgSenderERC2771(), newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function _msgSender()
        internal
        view
        override(ERC2771Context, Context)
        returns (address)
    {
        return Context._msgSender();
    }

    function _msgData()
        internal
        view
        override(ERC2771Context, Context)
        returns (bytes calldata)
    {
        return Context._msgData();
    }

    modifier onlyTrustedForwarder() {
        require(
            isTrustedForwarder(msg.sender),
            "Only callable by Trusted Forwarder"
        );
        _;
    }

    function _msgSenderERC2771()
        internal
        view
        returns (address sender)
    {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            /// @solidity memory-safe-assembly
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            revert('NO_TRUSTED');
        }
    }


}
