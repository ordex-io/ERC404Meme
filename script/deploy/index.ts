import { ethers } from "hardhat";

export async function deployNft404() {
  const factory = await ethers.getContractFactory("NFT404");
  return await factory.deploy();
}

export async function deployAutomationNonVrf() {
  const factory = await ethers.getContractFactory("AutomationNonVRF");
  return await factory.deploy();
}

export async function deployDna() {
  const factory = await ethers.getContractFactory("DNA");
  return await factory.deploy();
}
