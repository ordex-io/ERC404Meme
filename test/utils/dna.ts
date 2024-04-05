import { ethers } from "hardhat";
import { solidityPackedKeccak256 } from "ethers";

/**
 * Calculate the DNA to compare it.
 *
 * This is based on the given words and make abi.encodePacked and hash it with keccak256
 */
export function calculateDNA(id_: BigInt, words_: Array<bigint>): string {
  return solidityPackedKeccak256(["uint256", "uint256[]"], [id_, words_]);
}

export async function getBlockHash(blockNumber: number | null = null) {
  if (blockNumber === null) {
    blockNumber = await ethers.provider.provider.getBlockNumber();
  }

  const block = await ethers.provider.provider.getBlock(blockNumber);

  if (block && block.hash) {
    return block.hash;
  } else {
    throw `Not block obtained`;
  }
}
