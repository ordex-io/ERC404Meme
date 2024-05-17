import { ethers } from "hardhat";
import { getERC721TransfersEventsArgs } from "../utils";

export async function getId(tx: any, index: number = 0): Promise<bigint> {
  const pet404Facet = await ethers.getContractAt("PET404", ethers.ZeroAddress);
  const events721 = await getERC721TransfersEventsArgs(tx, pet404Facet);

  return events721[index].id;
}
