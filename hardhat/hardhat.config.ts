import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as glob from 'glob';
import { resolve } from 'path';
import { config as dotenvConfig } from "dotenv";

try {
  dotenvConfig();
} catch (error) {
  console.error(
      "Loading .env file failed. Things will likely fail. You may want to copy .env.template and create a new one.",
  );
}


const INFURA_ID =   process.env.INFURA_ID;

//// import task files when types have already been created
if (existsSync('./typechain-types')) {
  glob.sync('./tasks/**/*.ts').forEach(function (file: any) {
    require(resolve(file));
  });
}


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more  0x1b34B49CfC9f0e484bD6f3C47146205C7564bBBc

const mainnetGwei = 21;


let defaultNetwork = 'goerli';
//defaultNetwork = 'localhost';


const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork,

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
            forking: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/P2lEQkjFdNjdN0M_mpZKB8r3fAa2M0vT`,
      blockNumber: 32007194,
    },
      // forking: {
      //   url: `https://goerli.infura.io/v3/${INFURA_ID}`,
      //   blockNumber: 7850256
      //   },  
        chainId: 1337
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 1337,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_ID}`, // <---- YOUR INFURA ID! (or it won't work)
      //`https://speedy-nodes-nyc.moralis.io/${MORALIS_ID}/eth/mainnet`

      gasPrice: mainnetGwei * 1000000000,
          accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_ID}`, // <---- YOUR INFURA ID! (or it won't work)
      // `https://speedy-nodes-nyc.moralis.io/${MORALIS_ID}/eth/goerli`
          accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
    },
    polygon: {
      url: 'https://speedy-nodes-nyc.moralis.io/XXXXXXXXXXXXXXXXXXXx/polygon/mainnet', // <---- YOUR MORALIS ID! (not limited to infura)
      //https://polygon-rpc.com
      gasPrice: 1000000000,
          accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/P2lEQkjFdNjdN0M_mpZKB8r3fAa2M0vT`, // <---- YOUR MORALIS ID! (not limited to infura)
      // `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID_MUMBAI}`
      gasPrice: 1000000000,
      accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
    },

  },
  gasReporter: {
    enabled: process.env['REPORT_GAS'] !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env['ETHERSCAN_API_KEY'],
  },
};

export default config;
