import { ethers } from "hardhat";
import { JsonRpcProvider } from "ethers";
import { IPET404Exposer } from "../../typechain-types";

type checkUpKeppResponse = { upkeepNeeded: boolean; performData: string };

export async function checkUpKeppCall(
  contract_: IPET404Exposer,
  provider_: typeof ethers.provider | JsonRpcProvider
): Promise<checkUpKeppResponse> {
  const result = await provider_.call({
    to: await contract_.getAddress(),
    data: contract_.interface.encodeFunctionData("checkUpkeep", ["0x"]),
    from: ethers.ZeroAddress,
  });

  const decodedResult = contract_.interface.decodeFunctionResult(
    "checkUpkeep",
    result
  );

  return decodedResult.toObject() as checkUpKeppResponse;
}

export { deployFullPET404DiamondNonVrf, deployUniswapPool } from "./deploy";
