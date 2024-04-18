import { ethers } from "hardhat";
import {
  deployDna,
  deployPet404,
  deployAutomationNonVrf,
  getMultiInit,
  deployDiamondCat404,
} from "./deploy";
import { fulfillFacetCut } from "../utils";
import { getInitializationData, saveDeployment } from "./utils";

async function main() {
  // The deployer is the owner
  const [owner] = await ethers.getSigners();

  // Deploy facets
  const pet404Contract = await deployPet404();
  const dnaContract = await deployDna();
  const automationNonVrf = await deployAutomationNonVrf();
  const multiInitContract = await getMultiInit();

  // Configure Facet Cuts
  // The contract that hold the selectors that are already included.
  // The diamond contract will be the "proxy", and already have some functions
  // saved on selectors
  const diamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);

  // All the facet cuts for our facets
  const pet404FacetCut = await fulfillFacetCut(pet404Contract, [diamond]);
  const dnaFacetCut = await fulfillFacetCut(dnaContract, [diamond]);
  const autoNonVrfFacetCut = await fulfillFacetCut(automationNonVrf, [diamond]);
  const calldataInit = await getInitializationData(
    pet404Contract,
    dnaContract,
    automationNonVrf,
    multiInitContract
  );

  // Deploy the Diamond proxy
  const mainDiamondArgs = {
    owner: owner.address, // owner
    facets: [pet404FacetCut, dnaFacetCut, autoNonVrfFacetCut], //  Facets
    target: await multiInitContract.getAddress(), // Target address for initialization
    calldata: calldataInit, // Calldata that will be used for initialization
  };

  const { diamondContract, proxyCat404EncodedArgs } = await deployDiamondCat404(
    mainDiamondArgs
  );

  const addresses = {
    pet404Facet: await pet404Contract.getAddress(),
    dnaFacet: await dnaContract.getAddress(),
    automationNonVrf: await automationNonVrf.getAddress(),
    diamondMultiInit: await multiInitContract.getAddress(),
    diamondProxyCat404: await diamondContract.getAddress(),
    proxyCat404Args: {
      encoded: proxyCat404EncodedArgs,
      decoded: mainDiamondArgs,
    },
  };

  // Save the deployment
  await saveDeployment(addresses);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
