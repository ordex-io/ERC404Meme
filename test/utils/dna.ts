import { AbiCoder, keccak256 } from "ethers";

/**
 * Calculate the DNA to compare it.
 */
// TODO: Ask and change for the correct process
export function calculateDNA(
  id_: BigInt,
  words_: Array<BigInt>,
  seed_: BigInt
): string {
  const encoded = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256[]", "uint256"],
    [id_, words_, seed_]
  );

  return keccak256(encoded);
}
