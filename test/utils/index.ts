import { ethers } from "hardhat";
import { JsonRpcProvider } from "ethers";
import { AutomationBase } from "../../typechain-types";

type checkUpKeppResponse = { upkeepNeeded: boolean; performData: string };

export async function checkUpKeepCall(
  contract_: AutomationBase,
  provider_: typeof ethers.provider | JsonRpcProvider
): Promise<checkUpKeppResponse> {
  const result = await provider_.call({
    to: await contract_.getAddress(),
    data: contract_.interface.encodeFunctionData("checkUpkeep", ["0x"]),
    from: ethers.ZeroAddress,
  });

  const decodedResult = contract_.interface
    .decodeFunctionResult("checkUpkeep", result)
    .toArray();

  return {
    upkeepNeeded: decodedResult[0],
    performData: decodedResult[1],
  };
}

export { deployFullPET404DiamondNonVrf, deployUniswapPool } from "./deploy";
export { increaseTimestampTo as increaseTimestampBy } from "./time";
