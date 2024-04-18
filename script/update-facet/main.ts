import { ethers } from "hardhat";
import { FacetCutAction, fulfillFacetCut } from "../../utils";
import { deployPet404 } from "../deploy";
import { IERC2535DiamondCutInternal } from "../../typechain-types";

async function main() {
  // Deploy the new facet. For example, this could be used to deploy a new facet
  // of PET404 with some updated or fix.
  const pet404 = await deployPet404();
  const newPET404Address = await pet404.getAddress();
  // Or just hardcoded
  // const newPET404Address = "0x4Dd6BF4a433265D6B01Ae18E77Ef069Cb29a0790";
  console.log("New facet address: ", newPET404Address);

  // Hardcoded:
  const diamondAddress = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const diamondContract = await ethers.getContractAt("Diamond", diamondAddress);

  // The signer should be the admin
  const [owner] = await ethers.getSigners();

  if ((await diamondContract.owner()) != owner.address) {
    throw Error("The signer is not the owner of the diamond");
  }

  // Methods to replace the target from old pet404 to new pet404
  const replacePet404FacetCut = await fulfillFacetCut(
    pet404,
    [diamondContract],
    FacetCutAction.REPLACE
  );
  replacePet404FacetCut.target = newPET404Address;

  // Remove the selector that are not  present yet
  // Hardcoded atm
  const newSelector = "0x0cac36b2";
  let index = replacePet404FacetCut.selectors.indexOf(newSelector);
  if (index !== -1) {
    replacePet404FacetCut.selectors.splice(index, 1);
  }

  // Generate the new add methods
  const addPet404FacetCut: IERC2535DiamondCutInternal.FacetCutStruct = {
    target: newPET404Address,
    action: FacetCutAction.ADD,
    selectors: [newSelector],
  };

  const tx = await diamondContract.diamondCut(
    [replacePet404FacetCut, addPet404FacetCut],
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
