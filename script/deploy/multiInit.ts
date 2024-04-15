import { diamondMultInit } from "../deploy";
export async function getMultiInit() {
  const { multiInit, multiInitAddress, chainId } = await diamondMultInit();
  console.log(
    `The multi init is deployed at: ${multiInitAddress} - Chain ID: ${chainId}`
  );

  return multiInit;
}
