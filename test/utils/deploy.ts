import { ethers } from "hardhat";

export async function deployVRFCoordinartorV2Mock() {
  const factory = await ethers.getContractFactory("CoordinatorV2Mock");
  const contract = await factory.deploy(100, 100);
  return contract;
}
