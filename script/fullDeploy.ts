import { ethers } from "hardhat";
import { deployUniswapPool } from "./utils";

async function main() {
  const [recipient, owner] = await ethers.getSigners();
  const { Uniswap, PET404ContractsData } = await deployUniswapPool(
    recipient,
    owner
  );

  console.log("\n---\n");
  console.log("pet404Address: ", PET404ContractsData.pet404Address);
  console.log("automationAddress: ", PET404ContractsData.automationAddress);
  console.log("dnaContractAddress: ", PET404ContractsData.dnaContractAddress);
  console.log(
    "diamondContractAddress | erc404Address: ",
    PET404ContractsData.diamondContractAddress
  );
  console.log(
    "ownerSigner: ",
    await PET404ContractsData.ownerSigner.getAddress()
  );

  console.log("uniswapFactory: ", await Uniswap.uniswapFactory.getAddress());
  console.log("weth: ", await Uniswap.weth.getAddress());
  console.log("positionManager: ", await Uniswap.positionManager.getAddress());
  console.log("erc20Token: ", await Uniswap.erc20Token.getAddress());
  console.log("poolAddress: ", Uniswap.poolAddress);
  console.log(
    "aver2: ",
    await PET404ContractsData.diamondContract.balanceOf(Uniswap.poolAddress)
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
