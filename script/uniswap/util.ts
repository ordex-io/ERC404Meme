import { ethers } from "hardhat";
import {
  deployAutomationNonVrfFacet,
  deployCreate2Factory,
  deployDNAFacet,
  deployMultiInit,
  deployPET404ExposerFacet,
  deployPET404Facet,
  deployWithCreate2,
  fulfillFacetCut,
  readFile,
} from "../../utils";
import * as path from "path";

const addressesPath = path.join(__dirname, "./addresses.json");

export type Addresses = {
  UniswapV3Factory: string;
  NonfungiblePositionManager: string;
  SwapRouter: string;
};

export type UniswapV3Addresses = {
  [key: string]: Addresses;
};

// Get the uniswap addresses from '<project>/script/uniswap/addresses.json'
export function readAddresses(chainId: number | bigint): Addresses {
  const jsonAddresses = readFile(addressesPath) as UniswapV3Addresses;

  return jsonAddresses[chainId.toString(10)];
}

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
    initData: automationCalldata,
  } = await deployAutomationNonVrfFacet();

  // Deploy DNA Facet
  const {
    dnaContract,
    dnaContractAddress,
    deployArgs: dnaArgs,
    initData: dnaCalldata,
  } = await deployDNAFacet();

  // Deploy PET404 Facet
  const {
    pet404Contract,
    pet404ContractAddress,
    deployArgs: pet404Args,
    initData: pet404Calldata,
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
  // Multi initializer diamond
  const targets = [
    pet404ContractAddress,
    dnaContractAddress,
    automationNonVrfAddress,
  ];
  const calldatas = [pet404Calldata, dnaCalldata, automationCalldata];

  const { diamondMultiInit, calldataMultiInit } = await deployMultiInit(
    targets,
    calldatas
  );

  // Deploy create2 factory:
  const create2Factory = await deployCreate2Factory();
  console.log("create2Factory: ", await create2Factory.getAddress());

  // Deploy Diamond contract
  // Owner of the Diamond (have the ownership of the whole contract facets)
  const ownerSigner = (await ethers.getSigners())[0];

  const deloyArgs = [
    ownerSigner.address, // owner
    [pet404FacetCuts, dnaFacetCuts, automationFacetCuts, exposer404FacetCuts], //  Faucets
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  ]
  const diamondAddress = await deployWithCreate2(create2Factory, "Diamond", deloyArgs);

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
    automationAddress: automationNonVrfAddress,
    pet404Address: pet404ContractAddress,
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
