import { ethers, network } from "hardhat";
import { readConfiguration, saveConfiguration } from "../utils";
import { IERC2535DiamondCutInternal } from "../../typechain-types";

export { getMultiInit } from "./multiInit";

type Diamond404Args = {
  owner: string;
  facets: Array<IERC2535DiamondCutInternal.FacetCutStruct>;
  target: string;
  calldata: string; // Calldata that will be used for initialization
};

export async function deployNft404() {
  const [deployer] = await ethers.getSigners();

  const factory = await ethers.getContractFactory("NFT404");
  return await factory.connect(deployer).deploy();
}

export async function deployAutomationNonVrf() {
  const factory = await ethers.getContractFactory("AutomationNonVRF");
  return await factory.deploy();
}

export async function deployDna() {
  const factory = await ethers.getContractFactory("DNA");
  return await factory.deploy();
}

export async function deployDiamondCat404(args_: Diamond404Args) {
  const factoryDiamond = await ethers.getContractFactory("Diamond");
  const diamondContract = await factoryDiamond.deploy(
    args_.owner,
    args_.facets,
    args_.target,
    args_.calldata
  );

  const proxyCat404EncodedArgs = factoryDiamond.interface.encodeDeploy([
    args_.owner,
    args_.facets,
    args_.target,
    args_.calldata,
  ]);

  return { diamondContract, proxyCat404EncodedArgs };
}

export async function diamondMultInit() {
  const config = readConfiguration();

  const chainId: string = BigInt(
    await network.provider.send("eth_chainId")
  ).toString();

  if (!chainId) {
    throw new Error("Not chain ID found");
  }

  if (config.DiamondMultiInit[chainId]) {
    const address = config.DiamondMultiInit[chainId];
    const contract = await ethers.getContractAt("DiamondMultiInit", address);
    return {
      multiInit: contract,
      multiInitAddress: address,
      chainId,
    };
  }

  const factory = await ethers.getContractFactory("DiamondMultiInit");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  config.DiamondMultiInit[chainId] = await contract.getAddress();

  saveConfiguration(config);

  return {
    multiInit: contract,
    multiInitAddress: await contract.getAddress(),
    chainId,
  };
}
