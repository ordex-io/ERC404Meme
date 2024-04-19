import { ethers } from "hardhat";
// import {
//   deployDna,
//   deployPet404,
//   deployAutomationNonVrf,
//   getMultiInit,
//   deployDiamondCat404,
// } from "./deploy";
// import { fulfillFacetCut } from "../utils";
// import { getInitializationData, saveDeployment } from "../utils";
import { IERC2535DiamondCutInternal } from "../../typechain-types";
import { FacetCutAction } from "../../utils";

const addresses = {
  pet404Facet: "0x4Dd6BF4a433265D6B01Ae18E77Ef069Cb29a0790",
  dnaFacet: "0xbC76Efe16B93EF31D8305E09D7c9Effc9aab85f0",
  automationNonVrf: "0x50B2921A8c915A8228dA39e93AD9E9AA43fBc901",
  diamondProxyCat404: "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5",
};

async function main() {
  //
  const f = await ethers.getContractFactory("PET404Exposer");
  const contract = await f.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("Facet deployed at: ", contractAddress);

  const diamond = await ethers.getContractAt(
    "Diamond",
    addresses.diamondProxyCat404
  );

  const selector_0 = [
    ...(await diamond.facetFunctionSelectors(addresses.pet404Facet)),
  ];
  const selector_1 = [
    ...(await diamond.facetFunctionSelectors(addresses.diamondProxyCat404)),
  ];

  const skipSelectors = selector_0.concat(selector_1);

  const facetCut: IERC2535DiamondCutInternal.FacetCutStruct = {
    target: contractAddress,
    action: FacetCutAction.ADD,
    selectors: [],
  };

  contract.interface.forEachFunction((ff_) => {
    //
    if (!skipSelectors.includes(ff_.selector)) {
      facetCut.selectors.push(ff_.selector);
    }
  });

  const tx = await diamond.diamondCut(
    [facetCut],
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
