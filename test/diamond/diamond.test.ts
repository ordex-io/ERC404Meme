import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationNonVrfFacet,
  deployDNAFacet,
  deployNFT404Facet,
  fulfillFacetCut,
} from "../utils";
import { ethers } from "hardhat";

import { IDiamondNFT404__factory } from "../../typechain-types/factories/artifacts/contracts/diamond/IDiamondNFT404__factory";

async function deployFullNFT404DiamondNonVrf() {
  // Deploy DNA Facet
  const {
    dnaContract,
    dnaContractAddress,
    deployArgs: dnaArgs,
  } = await loadFixture(deployDNAFacet);

  // Deploy Automation Non VRF Facet
  const {
    automationNonVrf,
    automationRegistry,
    automationNonVrfAddress,
    deployArgs: automationArgs,
  } = await loadFixture(deployAutomationNonVrfFacet);

  // Deply NFT404 Facet
  const {
    nft404Contract,
    nft404ContractAddress,
    ownerSigner,
    deployArgs: nft404Args,
  } = await loadFixture(deployNFT404Facet);

  // Deploy Diamond contract
  const factory = await ethers.getContractFactory("Diamond");
  const diamondContract = await factory.deploy(nft404Args.owner);
  await diamondContract.waitForDeployment();

  // Fulfill the DNA Facet Cuts
  const dnaFacetCuts = await fulfillFacetCut(dnaContract, diamondContract);

  // Fulfill the Automation Facet Cuts
  const automationFacetCuts = await fulfillFacetCut(
    automationNonVrf,
    diamondContract
  );

  // Fulfill the NFT404 Facet Cuts
  const nft404FacetCuts = await fulfillFacetCut(
    nft404Contract,
    diamondContract
  );

  const tx = await diamondContract
    .connect(ownerSigner)
    .diamondCut(
      [dnaFacetCuts, automationFacetCuts, nft404FacetCuts],
      ethers.ZeroAddress,
      ethers.toBeArray(0)
    );

  await tx.wait();

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
  describe.only("Facets with Auto Non VRF", () => {
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
