//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract GasslessWalletFaucet {
    mapping(address => uint256) lastWithdraw;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function withdraw() external onlyOwner returns (bool) {
        (bool result, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        return result;
    }

    receive() external payable {}

    function fundSmartContractWallet(address wallet) onlyOnceInPeriod external returns (bool) {
        (bool result, ) = payable(wallet).call{value: 0.1 ether}("");
        lastWithdraw[msg.sender] = block.timestamp;
        return result;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
        _;
    }

       modifier onlyOnceInPeriod() {
        require(lastWithdraw[msg.sender] + 1 days >=  block.timestamp, "Period not finish");
        _;
    }
}
