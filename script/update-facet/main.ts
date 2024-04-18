import { ethers } from "hardhat";
import { FacetCutAction, fulfillFacetCut } from "../../utils";
import { deployNft404 } from "../deploy";
import { IERC2535DiamondCutInternal } from "../../typechain-types";

async function main() {
  // Deploy the new facet. For example, this could be used to deploy a new facet
  // of NFT404 with some updated or fix.
  const nft404 = await deployNft404();
  const newNFT404Address = await nft404.getAddress();
  // Or just hardcoded
  // const newNFT404Address = "0x4Dd6BF4a433265D6B01Ae18E77Ef069Cb29a0790";
  console.log("New facet address: ", newNFT404Address);

  // Hardcoded:
  const diamondAddress = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const diamondContract = await ethers.getContractAt("Diamond", diamondAddress);

  // The signer should be the admin
  const [owner] = await ethers.getSigners();

  if ((await diamondContract.owner()) != owner.address) {
    throw Error("The signer is not the owner of the diamond");
  }

  // Methods to replace the target from old nft404 to new nft404
  const replaceNft404FacetCut = await fulfillFacetCut(
    nft404,
    [diamondContract],
    FacetCutAction.REPLACE
  );
  replaceNft404FacetCut.target = newNFT404Address;

  // Remove the selector that are not  present yet
  // Hardcoded atm
  const newSelector = "0x0cac36b2";
  let index = replaceNft404FacetCut.selectors.indexOf(newSelector);
  if (index !== -1) {
    replaceNft404FacetCut.selectors.splice(index, 1);
  }

  // Generate the new add methods
  const addNft404FacetCut: IERC2535DiamondCutInternal.FacetCutStruct = {
    target: newNFT404Address,
    action: FacetCutAction.ADD,
    selectors: [newSelector],
  };

  const tx = await diamondContract.diamondCut(
    [replaceNft404FacetCut, addNft404FacetCut],
    ethers.ZeroAddress,
    ethers.getBytes("0x")
  );
  console.log("Tx hash: ", tx.hash);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
