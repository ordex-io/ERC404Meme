import { ethers } from "hardhat";
import { deployUniswapPool } from "../test/utils";

async function main() {
  const { Uniswap, PET404ContractsData } = await deployUniswapPool();

  const [, alice, bob] = await ethers.getSigners();

  const data = {
    Alice: alice.address,
    Bob: bob.address,
    ERC404Meme: PET404ContractsData.diamondContractAddress,
    AutomationMock: await PET404ContractsData.automationRegistry.getAddress(),
    ERC20: await Uniswap.erc20Token.getAddress(),
    SwapRouter: await Uniswap.swapRouter.getAddress(),
    Pool: Uniswap.poolAddress,
    Fee: Uniswap.fee,
    URL_Alice: `- See alice: http://localhost:3333/api/data/${alice.address}`,
  };

  console.log(JSON.stringify(data, null, 2));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
