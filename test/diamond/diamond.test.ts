import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationNonVrfFacet,
  deployDNAFacet,
  deployNFT404ExposerFacet,
  deployNFT404Facet,
  fulfillFacetCut,
  getInitData,
} from "../../utils";
import { ethers } from "hardhat";

async function deployFullNFT404DiamondNonVrf() {
  // Factory Diamond
  const zeroDiamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);
  const zeroIDiamont404 = await ethers.getContractAt(
    "IDiamondNFT404",
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

  // Deploy NFT404 Facet
  const {
    nft404Contract,
    nft404ContractAddress,
    deployArgs: nft404Args,
  } = await deployNFT404Facet();

  // Deploy NFT404 Facet (NOTE: only tests)
  const { nft404ExposerContract } = await deployNFT404ExposerFacet();

  // FULFILL THE FACET CUTS
  // NOTE: This order is really important when initializing (NFT404, DNA, Automation)

  // Fulfill the NFT404 Facet Cuts
  const nft404FacetCuts = await fulfillFacetCut(nft404Contract, [zeroDiamond]);

  // Fulfill the DNA Facet Cuts
  const dnaFacetCuts = await fulfillFacetCut(dnaContract, [zeroDiamond]);

  // Fulfill the Automation Facet Cuts
  const automationFacetCuts = await fulfillFacetCut(
    automationNonVrf,
    [zeroDiamond]
  );

  const exposer404FacetCuts = await fulfillFacetCut(
    nft404ExposerContract,
    [zeroIDiamont404]
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
    [nft404FacetCuts, dnaFacetCuts, automationFacetCuts, exposer404FacetCuts], //  Faucets
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  );
  await diamondContract.waitForDeployment();

  const diamondAddress = await diamondContract.getAddress();

  const iDiamond = await ethers.getContractAt(
    "INFT404Exposer",
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

describe("Diamond - NFT - CAT404", () => {
  describe("Facets with Auto Non VRF", () => {
    it("should use the correct owner address for different facets", async () => {
      const [signer0, signer1] = await ethers.getSigners();
      const { diamondContract, ownerSigner, facetsArgs } = await loadFixture(
        deployFullNFT404DiamondNonVrf
      );

      const transferExemptAddress = signer1.address;
      const newUri = "www.random-uri.com";
      const amountToMint = 50n * facetsArgs.nft404.units; // 50 * 404k

      // Initials states
      expect(await diamondContract.erc721TransferExempt(transferExemptAddress))
        .to.be.false;
      expect(await diamondContract.tokenURI(0)).to.not.contain(newUri);
      expect(
        await diamondContract.balanceOf(transferExemptAddress)
      ).to.be.equals(0n);

      // Should revert from NFT404 Facet with NON-owner
      expect(
        diamondContract
          .connect(signer0)
          .setERC721TransferExempt(transferExemptAddress, true)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      expect(
        diamondContract.connect(signer1).setBaseUri(newUri)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      expect(
        diamondContract
          .connect(signer0)
          .mintERC20(transferExemptAddress, amountToMint)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      // Should pass with owner
      await diamondContract
        .connect(ownerSigner)
        .setERC721TransferExempt(transferExemptAddress, true);

      await diamondContract.connect(ownerSigner).setBaseUri(newUri);

      await diamondContract
        .connect(ownerSigner)
        .mintERC20(transferExemptAddress, amountToMint);

      // End states
      expect(await diamondContract.erc721TransferExempt(transferExemptAddress))
        .to.be.true;
      expect(await diamondContract.tokenURI(0)).to.contain(newUri);
      expect(
        await diamondContract.balanceOf(transferExemptAddress)
      ).to.be.equals(amountToMint);
    });

    it("should mint NFT only if get enough ERC20 tokens", async () => {
      const [signer0] = await ethers.getSigners();
      const { diamondContract, ownerSigner, facetsArgs } = await loadFixture(
        deployFullNFT404DiamondNonVrf
      );

      expect(await diamondContract.balanceOf(signer0.address)).to.be.equals(0n);
      expect(
        await diamondContract.erc20BalanceOf(signer0.address)
      ).to.be.equals(0n);
      expect(
        await diamondContract.erc721BalanceOf(signer0.address)
      ).to.be.equals(0n);

      const nftQuantityToGet = 5n;
      const erc20Amount = nftQuantityToGet * facetsArgs.nft404.units;

      // Give some tokens to signer0
      await diamondContract
        .connect(ownerSigner)
        .mintERC20(signer0.address, erc20Amount);

      expect(await diamondContract.balanceOf(signer0.address)).to.be.equals(
        erc20Amount
      );
      expect(
        await diamondContract.erc20BalanceOf(signer0.address)
      ).to.be.equals(erc20Amount);
      expect(
        await diamondContract.erc721BalanceOf(signer0.address)
      ).to.be.equals(nftQuantityToGet);
    });
  });
});
