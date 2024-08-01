import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  // Our PET404NonVRF contract address with the PET404NonVRF interface (plus the exposer for tests)
  const diamondPet404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const diamondPet404 = await ethers.getContractAt(
    "IPET404Exposer",
    diamondPet404Address
  );

  // The minimum amount required to get a NFT (404k tokens) multiplied per 10
  const amount = (await diamondPet404.units()) * 10n;
  const receiver = owner.address;

  // Mint
  console.log(`Minting ${amount} ERC20 tokens to "${receiver}"`);
  const tx = await diamondPet404
    .connect(owner)
    ["mintERC20(address,uint256)"](receiver, amount);

  console.log("Transaction hash: ", tx.hash);

  await tx.wait();
  console.log("Transaction completed");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
