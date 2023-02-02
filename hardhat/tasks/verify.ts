import { readFileSync } from 'fs-extra';
import { task } from 'hardhat/config';
import { initEnv } from '../helpers/utils';
import { join } from 'path';

const contract_path_relative = 'src/assets/contracts/';
const processDir = process.cwd();
const contract_path = join(processDir, contract_path_relative);
const contract_config = JSON.parse(
  readFileSync(join(processDir, 'contract.config.json'), 'utf-8')
) as { [key: string]: any };

task('verify-contract', 'verify').setAction(async ({}, hre) => {
  let deployContract = 'gaslessMinting';
  let toDeployContract = contract_config[deployContract];
  // const toVerifyApp = JSON.parse(
  //   readFileSync(
  //     `${contract_path}/${toDeployContract.jsonName}_metadata.json`,
  //     'utf-8'
  //   )
  // );



  
  await hre.run('verify:verify', {
    address: '0xf87389350764548698E35bFEF1682B1328811657',
    constructorArguments: [] ,
  });
});
