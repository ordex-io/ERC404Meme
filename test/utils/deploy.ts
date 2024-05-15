import { ethers } from "hardhat";
import {
  deployAutomationNonVrfFacet,
  deployDNAFacet,
  deployPET404ExposerFacet,
  deployPET404Facet,
  fulfillFacetCut,
  getInitData,
} from "../../utils";

export async function deployFullPET404DiamondNonVrf() {
  // Factory Diamond
  const zeroDiamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);
  const zeroIDiamont404 = await ethers.getContractAt(
    "IDiamondPET404",
    ethers.ZeroAddress
  );

  // Deploy Automation Non VRF Facet
  const {
    automationNonVrf,
    automationRegistry,
    automationNonVrfAddress,
    deployArgs: automationArgs,
  } = await deployAutomationNonVrfFacet();

  // Deploy DNA Facet
  const {
    dnaContract,
    dnaContractAddress,
    deployArgs: dnaArgs,
  } = await deployDNAFacet();

  // Deploy PET404 Facet
  const {
    pet404Contract,
    pet404ContractAddress,
    deployArgs: pet404Args,
  } = await deployPET404Facet();

  // Deploy PET404 Facet (NOTE: only tests)
  const { pet404ExposerContract } = await deployPET404ExposerFacet();

  // FULFILL THE FACET CUTS
  // NOTE: This order is really important when initializing (PET404, DNA, Automation)

  // Fulfill the PET404 Facet Cuts
  const pet404FacetCuts = await fulfillFacetCut(pet404Contract, [zeroDiamond]);

  // Fulfill the DNA Facet Cuts
  const dnaFacetCuts = await fulfillFacetCut(dnaContract, [zeroDiamond]);

  // Fulfill the Automation Facet Cuts
  const automationFacetCuts = await fulfillFacetCut(automationNonVrf, [
    zeroDiamond,
  ]);

  const exposer404FacetCuts = await fulfillFacetCut(pet404ExposerContract, [
    zeroIDiamont404,
  ]);

  // Initializations calldata
  const pet404Calldata = getInitData(pet404Contract, "__PET404_init", [
    pet404Args.name,
    pet404Args.symbol,
    pet404Args.decimals,
    pet404Args.units,
    pet404Args.baseUri,
    pet404Args.maxTotalSupplyERC721_,
    pet404Args.initialMintRecipient_,
    pet404Args.uniswapFactory_,
  ]);

  const dnaCalldata = getInitData(dnaContract, "__DNA_init", [
    dnaArgs.schemaHash,
    dnaArgs.variantsName,
  ]);

  const automationCalldata = getInitData(
    automationNonVrf,
    "__AutomationNonVRF_init",
    [automationArgs.automationRegistryAddress]
  );

  // Multi initializer diamond
  const factoryDiamondMultiInit = await ethers.getContractFactory(
    "DiamondMultiInit"
  );
  const diamondMultiInit = await factoryDiamondMultiInit.deploy();

  const calldataMultiInit: string = getInitData(diamondMultiInit, "multiInit", [
    [pet404ContractAddress, dnaContractAddress, automationNonVrfAddress], // Targets
    [pet404Calldata, dnaCalldata, automationCalldata], // Calldata
  ]);

  // Deploy Diamond contract
  // Owner of the Diamond (have the ownership of the whole contract facets)
  const ownerSigner = (await ethers.getSigners())[9];

  const factoryDiamond = await ethers.getContractFactory("Diamond");
  const diamondContract = await factoryDiamond.deploy(
    ownerSigner.address, // owner
    [pet404FacetCuts, dnaFacetCuts, automationFacetCuts, exposer404FacetCuts], //  Faucets
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  );
  await diamondContract.waitForDeployment();

  const diamondAddress = await diamondContract.getAddress();

  const iDiamond = await ethers.getContractAt(
    "IPET404Exposer",
    diamondAddress,
    (
      await ethers.getSigners()
    )[0]
  );

  return {
    diamondContract: iDiamond,
    diamondContractAddress: diamondAddress,
    automationRegistry,
    dnaContractAddress,
    dnaFacet: dnaContract,
    automationAddress: automationNonVrfAddress,
    automationNonVrfFacet: automationNonVrf,
    pet404Address: pet404ContractAddress,
    pet404Facet: pet404Contract,
    ownerSigner,
    facetsArgs: {
      dna: dnaArgs,
      automation: automationArgs,
      pet404: pet404Args,
    },
    facetsCuts: {
      dna: dnaFacetCuts,
      automation: automationFacetCuts,
      pet404: pet404FacetCuts,
    },
  };
}
