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
// Go to https://hardhat.org/config/ to learn more

const mainnetGwei = 21;


const defaultNetwork = 'goerli';

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
        url: `https://goerli.infura.io/v3/${INFURA_ID}`,
        blockNumber: 7850256
        },  
        chainId: 1337
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 1337,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_ID}`, // <---- YOUR INFURA ID! (or it won't work)
      // `https://speedy-nodes-nyc.moralis.io/${MORALIS_ID}/eth/rinkeby`
      accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
      // accounts: {
      //   mnemonic: mnemonic(),
      // },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_ID}`, // <---- YOUR INFURA ID! (or it won't work)
      // `https://speedy-nodes-nyc.moralis.io/${MORALIS_ID}/eth/kovan`
      accounts:
        process.env['DEPLOYER_KEY'] !== undefined
          ? [process.env['DEPLOYER_KEY']]
          : [],
      // accounts: {
      //   mnemonic: mnemonic(),
      // },
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
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_ID}`, // <---- YOUR INFURA ID! (or it won't work)
      // `https://speedy-nodes-nyc.moralis.io/${MORALIS_ID}/eth/ropsten`
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
    xdai: {
      url: 'https://rpc.xdaichain.com/',
      gasPrice: 1000000000,
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
