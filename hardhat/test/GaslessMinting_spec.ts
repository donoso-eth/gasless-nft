import { expect } from "chai";
import { ethers } from "hardhat";

describe("GaslessMinting", function () {
  it("Should return the new greeting once it's changed", async function () {
    const GaslessMinting = await ethers.getContractFactory("GaslessMinting");
    const gaslessMinting = await capitalize(contractName).deploy();
    await gaslessMinting.deployed();

  });
});
