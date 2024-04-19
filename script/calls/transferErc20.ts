import { ethers } from "hardhat";

async function main() {
  const [owner, receiver] = await ethers.getSigners();

  // Our PET404 contract address with the PET404 interface (plus the exposer for tests)
  const diamondPet404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const diamondPet404 = await ethers.getContractAt(
    "IPET404Exposer",
    diamondPet404Address
  );

  // The minimum amount required to get a NFT (404k tokens) multiplied per 5
  const amount = (await diamondPet404.units()) * 5n;
  const receiverAddress = receiver.address;

  if ((await diamondPet404.erc20BalanceOf(owner.address)) < amount) {
    throw Error("Owner does not have enough balance to transfer");
  }

  // Transfer
  console.log(`Transfering ${amount} ERC20 tokens to "${receiverAddress}"`);
  const tx = await diamondPet404
    .connect(owner)
    .transfer(receiverAddress, amount);

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
