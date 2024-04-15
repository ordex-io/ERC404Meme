import { ethers } from "hardhat";
import {
  deployDna,
  deployNft404,
  deployAutomationNonVrf,
  getMultiInit,
} from "./deploy";
import { fulfillFacetCut } from "../utils";
import { getInitializationData, saveDeployment } from "./utils";

async function main() {
  // The deployer is the owner
  const [owner] = await ethers.getSigners();

  // Deploy facets
  const nft404Contract = await deployNft404();
  const dnaContract = await deployDna();
  const automationNonVrf = await deployAutomationNonVrf();
  const multiInitContract = await getMultiInit();

  // Configure Facet Cuts
  // The contract that hold the selectors that are already included.
  // The diamond contract will be the "proxy", and already have some functions
  // saved on selectors
  const diamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);

  // All the facet cuts for our facets
  const nft404FacetCut = await fulfillFacetCut(nft404Contract, [diamond]);
  const dnaFacetCut = await fulfillFacetCut(dnaContract, [diamond]);
  const autoNonVrfFacetCut = await fulfillFacetCut(automationNonVrf, [diamond]);

  const calldataInit = await getInitializationData(
    nft404Contract,
    dnaContract,
    automationNonVrf,
    multiInitContract
  );

  // Deploy the Diamond proxy
  const factoryDiamond = await ethers.getContractFactory("Diamond");
  const diamondContract = await factoryDiamond.deploy(
    owner.address, // owner
    [nft404FacetCut, dnaFacetCut, autoNonVrfFacetCut], //  Facets
    await multiInitContract.getAddress(), // Target address for initialization
    calldataInit // Calldata that will be used for initialization
  );

  // Save the deployment
  await saveDeployment(await diamondContract.getAddress());
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
