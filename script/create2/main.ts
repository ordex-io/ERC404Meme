import { ethers } from "hardhat";
import { deployCreate2Factory, deployWithCreate2 } from "../../utils";

// Start with 0x404
async function main() {
  const [owner] = await ethers.getSigners();
  const create2 = await deployCreate2Factory()

  const diamondArgs = [owner.address, [], ethers.ZeroAddress, '0x'];

  const address = await deployWithCreate2(create2, "Diamond", diamondArgs);
  console.log(address)
  const address2 = await deployWithCreate2(create2, "Diamond", diamondArgs);
  console.log(address2)
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
