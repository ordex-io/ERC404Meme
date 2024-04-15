import { ethers, network } from "hardhat";
import { readConfiguration, saveConfiguration } from "../utils";

export { getMultiInit } from "./multiInit";

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
