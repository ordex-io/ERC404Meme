import { AbiCoder, keccak256 } from "ethers";

/**
 * Calculate the DNA to compare it.
 */
export function calculateDNA(id_: BigInt, words_: Array<BigInt>): string {
  const encoded = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256[]"],
    [id_, words_]
  );

  return keccak256(encoded);
}
