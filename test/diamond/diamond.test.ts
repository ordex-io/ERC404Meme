import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationNonVrfFacet,
  deployDNAFacet,
  deployNFT404Facet,
  fulfillFacetCut,
  getInitData,
} from "../utils";
import { ethers } from "hardhat";

import { IDiamondNFT404__factory } from "../../typechain-types/factories/artifacts/contracts/diamond/IDiamondNFT404__factory";

async function deployFullNFT404DiamondNonVrf() {
  // Factory Diamond
  const zeroDiamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);

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

  // Deply NFT404 Facet
  const {
    nft404Contract,
    nft404ContractAddress,
    deployArgs: nft404Args,
  } = await deployNFT404Facet();

  // FULFILL THE FACET CUTS
  // NOTE: This order is really important when initializing (NFT404, DNA, Automation)

  // Fulfill the NFT404 Facet Cuts
  const nft404FacetCuts = await fulfillFacetCut(nft404Contract, zeroDiamond);

  // Fulfill the DNA Facet Cuts
  const dnaFacetCuts = await fulfillFacetCut(dnaContract, zeroDiamond);

  // Fulfill the Automation Facet Cuts
  const automationFacetCuts = await fulfillFacetCut(
    automationNonVrf,
    zeroDiamond
  );

  // Initializations calldata
  const nft404Calldata = getInitData(nft404Contract, "__NFT404_init", [
    nft404Args.name,
    nft404Args.symbol,
    nft404Args.decimals,
    nft404Args.units,
    nft404Args.baseUri,
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
    [nft404ContractAddress, dnaContractAddress, automationNonVrfAddress], // Targets
    [nft404Calldata, dnaCalldata, automationCalldata], // Calldata
  ]);

  // Deploy Diamond contract
  // Owner of the Diamond (have the ownership of the whole contract facets)
  const ownerSigner = (await ethers.getSigners())[9];

  const factoryDiamond = await ethers.getContractFactory("Diamond");
  const diamondContract = await factoryDiamond.deploy(
    ownerSigner.address, // owner
    [nft404FacetCuts, dnaFacetCuts, automationFacetCuts], //  Faucets
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  );
  await diamondContract.waitForDeployment();

  const diamondAddress = await diamondContract.getAddress();
  const iDiamond = IDiamondNFT404__factory.connect(
    diamondAddress,
    (await ethers.getSigners())[0]
  );

  return {
    diamondContract: iDiamond,
    diamondContractAddress: diamondAddress,
    automationRegistry,
    dnaContractAddress,
    automationAddress: automationNonVrfAddress,
    nft404Address: nft404ContractAddress,
    ownerSigner,
    facetsArgs: {
      dna: dnaArgs,
      automation: automationArgs,
      nft404: nft404Args,
    },
    facetsCuts: {
      dna: dnaFacetCuts,
      automation: automationFacetCuts,
      nft404: nft404FacetCuts,
    },
  };
}

describe.only("Diamond", () => {
  describe("Facets with Auto Non VRF", () => {
    xit("should add the correct selectors for each facet", async () => {
      const {
        diamondContract,
        dnaContractAddress,
        automationAddress,
        nft404Address,
        facetsCuts,
      } = await loadFixture(deployFullNFT404DiamondNonVrf);

      const dnaSelectors = await diamondContract.facetFunctionSelectors(
        dnaContractAddress
      );
      const automationSelectors = await diamondContract.facetFunctionSelectors(
        automationAddress
      );
      const nft404Selectors = await diamondContract.facetFunctionSelectors(
        nft404Address
      );

      expect(facetsCuts.dna.selectors).to.be.deep.equals(dnaSelectors);
      expect(facetsCuts.automation.selectors).to.be.deep.equals(
        automationSelectors
      );
      expect(facetsCuts.nft404.selectors).to.be.deep.equals(nft404Selectors);
    });

    it("should use the correct owner address for all facets", async () => {
      const { diamondContract } = await loadFixture(
        deployFullNFT404DiamondNonVrf
      );

      const a = await diamondContract.tokenURI(0);
      const b = await diamondContract.tokenURI(2);

      console.log(a);
      console.log(b);
    });
  });
});
