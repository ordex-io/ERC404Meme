import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationRegistryMock,
  getBlockHash,
  getEventArgs,
} from "../../utils";
import { ethers } from "hardhat";

import {
  RevealCalledEvent,
  NftsRevealedEvent,
} from "../../typechain-types/artifacts/contracts/automation/IAutomationBase";

describe("Automation - Non VRF", () => {
  async function deployAutoNonVRFMock() {
    let automationRegistry = await loadFixture(deployAutomationRegistryMock);

    let automationRegistryAddress = await automationRegistry.getAddress();

    const factory = await ethers.getContractFactory("AutomationNonVRFMock");
    const contract = await factory.deploy();

    await contract.waitForDeployment();

    const tx = await contract.__AutomationNonVRF_init(
      automationRegistryAddress
    );
    await tx.wait();

    return {
      contract,
      contractAddress: await contract.getAddress(),
      automationRegistry,
      deployArg: {
        automationRegistryAddress,
      },
    };
  }

  it("should fail if reveal is called from a non automation registry", async () => {
    const signers = await ethers.getSigners();
    const caller0 = signers[0];
    const caller1 = signers[1];
    const caller2 = signers[2];
    const { contract } = await loadFixture(deployAutoNonVRFMock);

    expect(contract.connect(caller0).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
    expect(contract.connect(caller1).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
    expect(contract.connect(caller2).reveal()).to.be.revertedWithCustomError(
      contract,
      "NoAutomationRegister"
    );
  });

  it("should call reveal from the automation registry ", async () => {
    const { contract, contractAddress, automationRegistry } = await loadFixture(
      deployAutoNonVRFMock
    );

    await contract.setIsWaiting(true);

    let tx = await automationRegistry.simulateAutoReveal(contractAddress);

    let revealCalledEvent = (await getEventArgs(
      tx,
      "RevealCalled",
      contract
    )) as RevealCalledEvent.OutputObject;

    let nftsRevealedEvent = (await getEventArgs(
      tx,
      "NftsRevealed",
      contract
    )) as NftsRevealedEvent.OutputObject;

    // Since it's an automation without VRF, we set the RequestID as zero.
    const requestIdExpected = 0n;
    // First reveal
    const nftRevealCounter0 = 0n;

    expect(revealCalledEvent.requestId).to.be.equals(requestIdExpected);
    expect(revealCalledEvent.block).to.be.equals(tx.blockNumber);

    expect(nftsRevealedEvent.requestId).to.be.equals(requestIdExpected);
    expect(nftsRevealedEvent.nftRevealCounter).to.be.equals(nftRevealCounter0);
    expect(nftsRevealedEvent.block).to.be.equals(tx.blockNumber);
  });

  it("should use the block hash when calling reveal", async () => {
    const { contract, contractAddress, automationRegistry } = await loadFixture(
      deployAutoNonVRFMock
    );

    await contract.setIsWaiting(true);

    // Calling reveal 1st time
    let tx0 = await automationRegistry.simulateAutoReveal(contractAddress);

    // Get the block hash used in the 1st reveal
    let blockHash0 = await getBlockHash(tx0.blockNumber! - 1); // We know that blocknumber exist

    let { nftRevealCounter: nftRevealCounter0 } = (await getEventArgs(
      tx0,
      "NftsRevealed",
      contract
    )) as NftsRevealedEvent.OutputObject;

    let words0 = await contract.getWordsByPointer(nftRevealCounter0);

    expect(words0).to.be.deep.equals([BigInt(blockHash0)]);

    await contract.setIsWaiting(true);

    // Calling reveal 2nd time
    let tx1 = await automationRegistry.simulateAutoReveal(contractAddress);

    // Get the block hash used in the 2nd reveal
    let blockHash1 = await getBlockHash(tx1.blockNumber! - 1); // We know that blocknumber exist

    let { nftRevealCounter: nftRevealCounter1 } = (await getEventArgs(
      tx1,
      "NftsRevealed",
      contract
    )) as NftsRevealedEvent.OutputObject;

    let words1 = await contract.getWordsByPointer(nftRevealCounter1);

    expect(words1).to.be.deep.equals([BigInt(blockHash1)]);
  });
});
