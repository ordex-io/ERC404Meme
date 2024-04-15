import { ethers } from "hardhat";
import { deployDna, deployNft404, deployAutomationNonVrf } from "./deploy";

async function main() {
  // const nft404Contract = await deployNft404();
  // const automationNonVrf = await deployAutomationNonVrf();
  // const dnaContract = await deployDna();

  const dnaFactory = await ethers.getContractFactory("DNA");
  dnaFactory.interface.forEachFunction((f_) => {
    //
    console.log(`${f_.name} -> ${f_.selector}`);
  });
}

main()
  .then(() => {
    //
  })
  .finally(() => {
    //
  });
