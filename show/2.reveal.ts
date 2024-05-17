import { ethers } from "hardhat";
import data from "./data.json";
import { getDiamondPET404, getAutomationMock } from "../utils";

async function main() {
  const [callerNode] = await ethers.getSigners();

  // Get instances
  const ERC404Meme = await getDiamondPET404(data.ERC404Meme, callerNode);
  const automation = await getAutomationMock(data.AutomationMock, callerNode);

  const tx = await automation.simulateAutoReveal(await ERC404Meme.getAddress());
  await tx.wait();

  console.log("Reveal completed!");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
