import { ethers } from "hardhat";

async function main() {
  const [signer1] = await ethers.getSigners();

  const diamondCat404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const zeroIDiamont404 = await ethers.getContractAt(
    "IDiamondNFT404",
    diamondCat404Address
  );

  // The minimum to get a NFT
  const amount = await zeroIDiamont404.units();
  const toAddress = "0xbF334f8BD1420a1CbFE15407f73919424934B1B3";

  const tx = await zeroIDiamont404.connect(signer1).transfer(toAddress, amount);

  console.log("tx hash: ", tx.hash);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
